"""
AWS Lambda function for AI-powered Name Reconciliation using Amazon Bedrock
This replaces traditional SQL soundex queries with intelligent ML-based fuzzy matching
"""

import json
import os
import time
from typing import List, Dict, Any, Optional
import boto3
from boto3.dynamodb.conditions import Attr
import re

# Initialize AWS clients
bedrock_runtime = boto3.client('bedrock-runtime', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))

# Environment variables
ENTITIES_TABLE_NAME = os.environ.get('ENTITIES_TABLE_NAME', 'ExpertEntities')
BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-sonnet-20240229-v1:0')

def lambda_handler(event, context):
    """
    Main Lambda handler for name reconciliation requests
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        entities = body.get('entities', [])
        threshold = body.get('threshold', 70)
        include_conflicts = body.get('includeConflictsCheck', False)
        
        if not entities:
            return create_response(400, {'error': 'No entities provided'})
        
        start_time = time.time()
        
        # Process each entity
        results = []
        for entity in entities:
            result = reconcile_entity(entity, threshold)
            results.append(result)
        
        # Run conflicts check if requested
        conflicts_report = None
        if include_conflicts:
            conflicts_report = check_conflicts(entities, results)
        
        processing_time = int((time.time() - start_time) * 1000)
        
        response_body = {
            'results': results,
            'conflictsReport': conflicts_report,
            'processingTime': processing_time
        }
        
        return create_response(200, response_body)
        
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return create_response(500, {'error': str(e)})


def reconcile_entity(entity: Dict[str, Any], threshold: int) -> Dict[str, Any]:
    """
    Reconcile a single entity using AI-powered matching
    """
    entity_name = entity.get('name', '').strip()
    entity_type = entity.get('entityType', 'client')
    
    if not entity_name:
        return {
            'inputEntity': entity,
            'matches': [],
            'recommendation': 'create_new'
        }
    
    # Fetch potential matches from database
    existing_entities = fetch_existing_entities(entity_type)
    
    if not existing_entities:
        return {
            'inputEntity': entity,
            'matches': [],
            'recommendation': 'create_new'
        }
    
    # Use AI to analyze matches
    matches = analyze_matches_with_ai(entity_name, existing_entities, entity_type)
    
    # Filter by threshold
    filtered_matches = [m for m in matches if m['matchScore'] >= threshold]
    
    # Determine recommendation
    if not filtered_matches:
        recommendation = 'create_new'
        selected_match = None
    elif filtered_matches[0]['matchScore'] >= 90:
        recommendation = 'use_existing'
        selected_match = filtered_matches[0]
    else:
        recommendation = 'needs_review'
        selected_match = None
    
    return {
        'inputEntity': entity,
        'matches': filtered_matches,
        'recommendation': recommendation,
        'selectedMatch': selected_match
    }


def fetch_existing_entities(entity_type: str, limit: int = 100) -> List[Dict[str, Any]]:
    """
    Fetch existing entities from DynamoDB
    In production, this would query your actual Expert database
    """
    try:
        table = dynamodb.Table(ENTITIES_TABLE_NAME)
        
        response = table.scan(
            FilterExpression=Attr('entityType').eq(entity_type),
            Limit=limit
        )
        
        return response.get('Items', [])
        
    except Exception as e:
        print(f"Error fetching entities: {str(e)}")
        # Return mock data for development
        return get_mock_entities(entity_type)


def analyze_matches_with_ai(
    input_name: str,
    existing_entities: List[Dict[str, Any]],
    entity_type: str
) -> List[Dict[str, Any]]:
    """
    Use Amazon Bedrock (Claude) to intelligently match names
    This replaces traditional soundex with ML-powered fuzzy matching
    """
    
    # Prepare entity list for AI analysis
    entity_list = "\n".join([
        f"{i+1}. {entity.get('name', 'Unknown')} (ID: {entity.get('id', 'N/A')})"
        for i, entity in enumerate(existing_entities[:20])  # Limit to top 20 for token efficiency
    ])
    
    # Craft prompt for Claude
    prompt = f"""You are an expert legal name matching system. Your task is to analyze if an input name matches any existing entities in a database, considering:

1. Exact matches
2. Spelling variations and typos
3. Nicknames and abbreviations (e.g., "Bob" = "Robert", "ABC Corp" = "ABC Corporation")
4. Different name orderings (e.g., "Smith, John" vs "John Smith")
5. Middle names/initials
6. Corporate entity suffixes (LLC, Inc, Ltd, etc.)
7. Phonetic similarities

Input Name: "{input_name}"
Entity Type: {entity_type}

Existing Entities in Database:
{entity_list}

For each entity that could potentially match, provide:
1. Match score (0-100)
2. Reason for the match
3. Suggested action (merge, create_new, or review)

Return ONLY a valid JSON array (no markdown, no explanations) in this exact format:
[
  {{
    "existingId": "entity_id",
    "existingName": "entity_name",
    "matchScore": 95,
    "matchReason": "exact match with different capitalization",
    "suggestedAction": "merge"
  }}
]

If no matches are found, return an empty array: []

Important: Match scores should be:
- 95-100: Nearly identical (merge recommended)
- 80-94: Very similar (merge likely, review recommended)
- 60-79: Moderately similar (review required)
- Below 60: Weak match (likely not a match)
"""

    try:
        # Call Bedrock API
        response = bedrock_runtime.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            contentType='application/json',
            accept='application/json',
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 2000,
                "temperature": 0.1,  # Low temperature for consistency
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            })
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        ai_response = response_body.get('content', [{}])[0].get('text', '[]')
        
        # Extract JSON from response (in case AI adds markdown)
        ai_response = extract_json_from_text(ai_response)
        
        matches = json.loads(ai_response)
        
        # Enrich matches with additional data
        enriched_matches = []
        for match in matches:
            existing_entity = next(
                (e for e in existing_entities if e.get('id') == match.get('existingId')),
                None
            )
            
            if existing_entity:
                match['entityType'] = entity_type
                match['additionalData'] = {
                    'email': existing_entity.get('email'),
                    'phone': existing_entity.get('phone'),
                    'lastModified': existing_entity.get('lastModified'),
                    'createdBy': existing_entity.get('createdBy')
                }
                enriched_matches.append(match)
        
        # Sort by match score descending
        enriched_matches.sort(key=lambda x: x.get('matchScore', 0), reverse=True)
        
        return enriched_matches
        
    except Exception as e:
        print(f"Error calling Bedrock API: {str(e)}")
        # Fallback to basic string matching
        return fallback_string_matching(input_name, existing_entities, entity_type)


def extract_json_from_text(text: str) -> str:
    """
    Extract JSON array from text that might contain markdown or other formatting
    """
    # Try to find JSON array in the text
    json_match = re.search(r'\[[\s\S]*\]', text)
    if json_match:
        return json_match.group(0)
    return '[]'


def fallback_string_matching(
    input_name: str,
    existing_entities: List[Dict[str, Any]],
    entity_type: str
) -> List[Dict[str, Any]]:
    """
    Fallback to basic string similarity if AI fails
    Uses simple Levenshtein-like matching
    """
    matches = []
    input_lower = input_name.lower().strip()
    
    for entity in existing_entities[:10]:  # Limit to 10
        entity_name = entity.get('name', '').lower().strip()
        
        # Calculate simple similarity score
        score = calculate_similarity(input_lower, entity_name)
        
        if score >= 60:
            matches.append({
                'existingId': entity.get('id', ''),
                'existingName': entity.get('name', ''),
                'entityType': entity_type,
                'matchScore': score,
                'matchReason': f'String similarity: {score}%',
                'suggestedAction': 'merge' if score >= 90 else 'review',
                'additionalData': {
                    'email': entity.get('email'),
                    'phone': entity.get('phone')
                }
            })
    
    matches.sort(key=lambda x: x['matchScore'], reverse=True)
    return matches


def calculate_similarity(str1: str, str2: str) -> int:
    """
    Simple similarity score calculation (0-100)
    """
    if str1 == str2:
        return 100
    
    # Check if one is substring of other
    if str1 in str2 or str2 in str1:
        return 85
    
    # Count common words
    words1 = set(str1.split())
    words2 = set(str2.split())
    common_words = words1.intersection(words2)
    
    if not words1 or not words2:
        return 0
    
    similarity = (len(common_words) * 2) / (len(words1) + len(words2)) * 100
    return int(similarity)


def check_conflicts(
    entities: List[Dict[str, Any]],
    reconciliation_results: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Check for conflicts of interest using AI
    """
    # Extract all entity names for conflict analysis
    all_names = [e.get('name', '') for e in entities]
    
    # Use AI to analyze potential conflicts
    prompt = f"""You are a legal conflicts checking system. Analyze these entities for potential conflicts of interest:

Entities being checked:
{json.dumps(all_names, indent=2)}

Check for:
1. Direct conflicts (representing opposing parties in same matter)
2. Positional conflicts (conflicting business interests)
3. Prior representation conflicts
4. Business relationship conflicts

Return ONLY valid JSON in this format:
{{
  "hasConflicts": false,
  "conflicts": [],
  "riskLevel": "none"
}}

If conflicts are found, include them in the conflicts array with:
- conflictType
- description
- affectedParties
- severity ("critical", "high", "medium", "low")
- recommendedAction
"""

    try:
        response = bedrock_runtime.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            contentType='application/json',
            accept='application/json',
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1500,
                "temperature": 0.1,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            })
        )
        
        response_body = json.loads(response['body'].read())
        ai_response = response_body.get('content', [{}])[0].get('text', '{}')
        
        # Extract JSON
        json_text = extract_json_from_text(ai_response) if '[' in ai_response else ai_response
        conflicts_data = json.loads(json_text)
        
        conflicts_data['generatedAt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        
        return conflicts_data
        
    except Exception as e:
        print(f"Error checking conflicts: {str(e)}")
        return {
            'hasConflicts': False,
            'conflicts': [],
            'riskLevel': 'none',
            'generatedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        }


def get_mock_entities(entity_type: str) -> List[Dict[str, Any]]:
    """
    Mock data for development/testing
    """
    return [
        {
            'id': 'CLI-001',
            'name': 'John E. Smith',
            'entityType': 'client',
            'email': 'jsmith@example.com',
            'phone': '+1-555-0101',
            'lastModified': '2024-11-15T10:30:00Z'
        },
        {
            'id': 'CLI-002',
            'name': 'Jane Smith LLC',
            'entityType': 'client',
            'email': 'jane.smith@smithllc.com',
            'phone': '+1-555-0102',
            'lastModified': '2024-10-20T14:15:00Z'
        },
        {
            'id': 'CLI-003',
            'name': 'ABC Corporation',
            'entityType': 'client',
            'email': 'legal@abccorp.com',
            'phone': '+1-555-0103',
            'lastModified': '2024-09-05T09:00:00Z'
        },
        {
            'id': 'CLI-004',
            'name': 'Robert Johnson',
            'entityType': 'client',
            'email': 'rjohnson@email.com',
            'lastModified': '2024-08-12T16:45:00Z'
        }
    ]


def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create API Gateway response
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        'body': json.dumps(body)
    }
