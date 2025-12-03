Expert File Opening Overview Solution Overview The Expert File Opening Workflow captures
and automates the entire business process of creating and editing new Clients and Matters
from start to end. Out of the box, the sample template provides a best practice File
Opening solution based on feedback received from our many prior implementations. The
solution contains many configuration settings which are designed to personalize the
behavior of the Workflow without needing further assistance from Aderant Consultants. This
provides an easier implementation experience and offers a lower cost of ownership for the
firm. For those firms that have requirements that extend beyond the standard template, the
option customize almost every facet of the solution remains available. Workflow Components
The following sections will break down each of the components of the Workflow in order of
their appearance.

1. Initial Intake In this task, the initiator must enter information relating to the new
   Matter, for either a new or existing Client. By default, this first task will contain
   the minimum amount of data entry fields required in order to quickly pass the intake
   into the Name Reconciliation and Conflicts Check process. A configurations setting
   exists in order to enable all Client and Matter related data entry fields in this task.
2. Names Reconciliation and Conflicts Check This task is first used to reconcile the
   entered names (Client, Matter Parties, Contacts) with names that exist already in the
   database. Secondly, using an embedded Browser Conflicts webpage, new names are passed
   into the Conflicts engine and checked against an Expert or third party database for
   conflicts of interest and a Conflicts report is generated. Finally a task is sent to
   the Requesting Attorney for Conflicts Approval.
3. Client and Matter Code Generation Before saving the Workflow, the system can generate a
   code for the Client and Matter. These codes can be manually entered if the firm
   requires it.
4. Pending Save By enabling a configuration setting, the Workflow can save the Client and
   Matter with a �Pending� status code which may have limited privileges depending on the
   firm�s requirements. The purpose of this is to allow timekeepers to access the new
   intake without waiting for the Workflow to finish.
5. Additional Information Task This second data entry task contains every Client and
   Matter related field and is used to supply detailed information about the intake.
6. Administrative Approvals The Workflow must pass several Approval tasks before being
   accepted. The requirements to trigger these Approvals can be seen in the Flow Diagrams
   page.
7. Final Save The intake is saved with an �Open� status and emails are sent to any
   required employee informing them of the new Client/Matter. Data Entry Tasks Approval
   Tasks Expert File Opening Flow Diagrams Confidential
