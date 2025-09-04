export  function FindRequestSequence(reqType: any, userId: number) {

    if(reqType.notedById === userId ) return 0;
    if(reqType.checkedById === userId ) return 1;
    if(reqType.checkedBy2Id === userId ) return 2;
    if(reqType.recomApprovalId === userId ) return 3;
    if(reqType.recomApproval2Id === userId ) return 4;
    if(reqType.approveById === userId ) return 5;
    return null;
}

const APPROVAL_FLOW = [
    "notedBy",
    "checkedBy",
    "checkedBy2",
    "recomApproval",
    "recomApproval2",
    "approveBy",
  ] as const;
  
  type ApprovalKey = typeof APPROVAL_FLOW[number];
  
  export function RequestSequenceChecker(sequenceNumber: number, approval: any, status: string) {
    if(approval[APPROVAL_FLOW[sequenceNumber]] === status ){
      for (let i = sequenceNumber + 1; i >= 0; i--) {
        let sequenceCheck = sequenceNumber-1;
      const key = APPROVAL_FLOW[sequenceCheck];         
      const approvalStatus = approval[key]; 
      if (approvalStatus === "PENDING" || approvalStatus === "REJECTED") {
        console.log(
          "Blocked at step", sequenceCheck,
          "| Key:", key,
          "| Status:", approvalStatus
        );
        return false; // 🚫 stop here because this or a prior step is still pending
      }else if(status === "APPROVED"){
        return true;
      }
      else{
         sequenceCheck --;
         continue;
      }
    }
    return true; // ✅ all steps up to sequenceNumber are approved
    }
    return false;
   
  }