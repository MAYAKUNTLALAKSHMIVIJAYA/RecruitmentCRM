export interface RiskAssessment {
  level: 'Low' | 'Medium' | 'High' | 'Critical';
  reasons: string[];
  recommendedActions: string[];
}

interface RiskEvaluationParams {
  inFinalStagesElsewhere?: boolean;
  competingOffers?: boolean;
  dissatisfiedWithDelays?: boolean;
  isOverdue?: boolean;
  daysWaiting?: number;
  priority?: string;
  submissionStatus?: string;
}

export const evaluateCandidateRisk = (params: RiskEvaluationParams): RiskAssessment => {
  const {
    inFinalStagesElsewhere = false,
    competingOffers = false,
    dissatisfiedWithDelays = false,
    isOverdue = false,
    daysWaiting = 0,
    priority = 'Medium',
    submissionStatus = 'Submitted',
  } = params;

  const reasons: string[] = [];
  const recommendedActions: string[] = [];

  // Completed or withdrawn statuses do not carry active risk
  if (['Selected', 'Placed', 'Rejected', 'Withdrawn', 'Closed'].includes(submissionStatus)) {
    return {
      level: 'Low',
      reasons: ['Submission has reached a terminal status.'],
      recommendedActions: [],
    };
  }

  // Critical Risk Condition: Final stages elsewhere + overdue feedback OR competing offer + high waiting
  if (inFinalStagesElsewhere && (isOverdue || daysWaiting >= 4)) {
    reasons.push('Candidate is currently in final interview rounds with another company.');
    if (isOverdue) reasons.push('Hiring manager feedback deadline has expired.');
    if (daysWaiting >= 4) reasons.push(`Candidate has been waiting for ${daysWaiting} days without a feedback response.`);
    
    recommendedActions.push('Urgent: Call hiring manager directly for immediate interview decision.');
    recommendedActions.push('Send priority escalation to Account Lead.');
    recommendedActions.push('Contact candidate immediately to reassure them and gauge active timelines.');

    return {
      level: 'Critical',
      reasons,
      recommendedActions,
    };
  }

  if (competingOffers && (isOverdue || daysWaiting >= 3)) {
    reasons.push('Candidate holds an active competing job offer.');
    if (isOverdue) reasons.push('Hiring manager response is overdue.');
    reasons.push('High probability of candidate accepting competing offer if delayed.');

    recommendedActions.push('Issue an expedited follow-up requesting same-day review.');
    recommendedActions.push('Escalate to internal Recruitment Director.');
    recommendedActions.push('Schedule briefing call with candidate.');

    return {
      level: 'Critical',
      reasons,
      recommendedActions,
    };
  }

  // High Risk Conditions
  if (inFinalStagesElsewhere || competingOffers) {
    if (inFinalStagesElsewhere) reasons.push('Candidate is in advanced stages with other employers.');
    if (competingOffers) reasons.push('Candidate has competing market offers in progress.');
    if (daysWaiting >= 2) reasons.push(`Waiting ${daysWaiting} days for client review.`);

    recommendedActions.push('Send gentle priority reminder to hiring manager.');
    recommendedActions.push('Maintain active recruiter touchpoint with candidate.');

    return {
      level: 'High',
      reasons,
      recommendedActions,
    };
  }

  if (dissatisfiedWithDelays || isOverdue || daysWaiting >= 6) {
    if (dissatisfiedWithDelays) reasons.push('Candidate has expressed concern or frustration regarding communication delays.');
    if (isOverdue) reasons.push('Hiring manager feedback is past the agreed SLA date.');
    if (daysWaiting >= 6) reasons.push(`Extended wait time of ${daysWaiting} days.`);

    recommendedActions.push('Execute follow-up reminder to client hiring manager.');
    recommendedActions.push('Send check-in email/call to the candidate.');

    return {
      level: 'High',
      reasons,
      recommendedActions,
    };
  }

  // Medium Risk Conditions
  if (daysWaiting >= 3 || priority === 'High' || priority === 'Critical') {
    if (daysWaiting >= 3) reasons.push(`Candidate has been awaiting feedback for ${daysWaiting} days.`);
    if (priority === 'High' || priority === 'Critical') reasons.push(`High priority candidate profile requiring fast-track processing.`);

    recommendedActions.push('Queue standard follow-up reminder.');
    recommendedActions.push('Monitor feedback turnaround against SLA.');

    return {
      level: 'Medium',
      reasons,
      recommendedActions,
    };
  }

  // Low Risk Default
  return {
    level: 'Low',
    reasons: ['Submission is within standard review SLA window.'],
    recommendedActions: ['Continue tracking regular follow-up schedule.'],
  };
};
