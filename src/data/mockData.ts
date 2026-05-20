import type {
  ContactPerson,
  OnboardingPhase,
  Resource,
  UserProfile,
} from '../types/onboarding'
import { FALLBACK_OUTLETS } from '../lib/outletsApi'

export const STORAGE_KEY = 'quackteow-onboarding-progress'

export const OUTLETS = [...FALLBACK_OUTLETS] as const

export const defaultUserProfile: UserProfile = {
  id: 'hire-001',
  name: '',
  role: 'cook',
  outlet: 'TTDI',
  startDate: new Date().toISOString().slice(0, 10),
  buddy: '',
  supervisor: '',
}

export const ownerLabels: Record<string, string> = {
  EXCO: 'Executive Committee',
  GM: 'General Manager',
  SUP: 'Supervisor',
  HIRE: 'You',
  ALL: 'All parties',
}

export const ownerColors: Record<string, string> = {
  EXCO: 'bg-violet-100 text-violet-800',
  GM: 'bg-blue-100 text-blue-800',
  SUP: 'bg-emerald-100 text-emerald-800',
  HIRE: 'bg-amber-100 text-amber-800',
  ALL: 'bg-slate-100 text-slate-700',
}

export const onboardingPhases: OnboardingPhase[] = [
  {
    id: 'phase-0',
    number: 0,
    title: 'Preboarding',
    subtitle: 'Before Day 1',
    dayRange: 'Offer accepted → Day 0',
    description:
      'Structured preboarding so you arrive informed, uniformed, and ready — not confused.',
    descriptionByRole: {
      cook:
        'Before Day 1, your outlet team prepares your kitchen station and training materials.',
      cashier:
        'Before Day 1, your outlet team prepares your POS access and front-of-house onboarding.',
      supervisor:
        'Before Day 1, your outlet team prepares your leadership onboarding path.',
    },
    sections: [
      {
        id: 'preboarding-checklist',
        title: 'Preboarding Checklist',
        tasks: [
          {
            id: 'p0-t1',
            title: 'Send offer letter and contract for signing',
            whyItMatters:
              'Formalises employment and creates legal clarity before Day 1.',
            owner: 'EXCO',
            roles: ['all'],
            audience: 'internal',
          },
          {
            id: 'p0-t2',
            title:
              'Collect required documents (IC, bank account, EPF number, tax number)',
            whyItMatters:
              'Enables payroll setup. Malaysia Employment Act requirement.',
            owner: 'GM',
            roles: ['all'],
            audience: 'internal',
          },
          {
            id: 'p0-t3',
            title: 'Set up payroll and banking details in system',
            whyItMatters:
              'New hire must receive first pay on time. Late first pay damages trust immediately.',
            owner: 'GM',
            roles: ['all'],
            audience: 'internal',
          },
          {
            id: 'p0-t4',
            title: "WhatsApp 'Welcome to Quackteow' message from EXCO",
            whyItMatters:
              'Sets the cultural tone. Shows you are expected and valued — not just processed.',
            owner: 'EXCO',
            roles: ['all'],
            audience: 'internal',
          },
          {
            id: 'p0-t5',
            title:
              'Share outlet address, parking info, dress code, and report-in time',
            whyItMatters:
              'Eliminates Day 1 anxiety about logistics.',
            owner: 'GM',
            roles: ['all'],
            audience: 'internal',
          },
          {
            id: 'p0-t6',
            title: 'Prepare uniform in correct size',
            whyItMatters:
              'Uniform is part of brand identity (SOP §3.3). Arriving without one on Day 1 is a poor start.',
            owner: 'SUP',
            roles: ['all'],
            audience: 'internal',
          },
          {
            id: 'p0-t7',
            title: "Assign a 'Buddy' from existing staff at the outlet",
            whyItMatters:
              'A peer buddy reduces social isolation in the first week.',
            owner: 'SUP',
            roles: ['all'],
            audience: 'internal',
          },
          {
            id: 'p0-t8',
            title: 'Brief the buddy on their role and expectations',
            whyItMatters:
              'Unbriefed buddies may default to informal culture that contradicts SOP standards.',
            owner: 'SUP',
            roles: ['all'],
            audience: 'internal',
          },
          {
            id: 'p0-t9',
            title: 'Create POS user account and assign access level',
            whyItMatters:
              'System access on Day 1 — not Day 3. Waiting wastes training time.',
            owner: 'GM',
            roles: ['all'],
            audience: 'internal',
          },
          {
            id: 'p0-t10',
            title: "Prepare new hire's workstation / cooking station",
            whyItMatters:
              "Physical readiness signals: 'We were expecting you'.",
            owner: 'SUP',
            roles: ['all'],
            audience: 'internal',
          },
          {
            id: 'p0-t11',
            title:
              'Print and laminate Appendix A (Cooking Sequence) and Appendix B (Portion Card)',
            whyItMatters:
              'Reference materials should be physical and at-station from Day 1.',
            owner: 'SUP',
            roles: ['cook'],
            audience: 'internal',
          },
          {
            id: 'p0-t12',
            title:
              'Print Training Sign-Off Form (Appendix E of SOP) — ready for Week 1',
            whyItMatters:
              'Having the form ready prevents supervisors from improvising assessments.',
            owner: 'GM',
            roles: ['all'],
            audience: 'internal',
          },
        ],
      },
    ],
  },
  {
    id: 'phase-1',
    number: 1,
    title: 'Orientation',
    subtitle: 'Week 1 (Days 1–7)',
    dayRange: 'Days 1–7',
    description:
      'Week 1 is about foundation — not productivity. Build standards before speed.',
    descriptionByRole: {
      cook:
        'Your first week in the kitchen: learn portions, food safety, and cooking standards before speed.',
      cashier:
        'Your first week on the floor: learn POS, order accuracy, and customer service before speed.',
      supervisor:
        'Your first week on the supervisor track: learn outlet standards, escalation, and team routines.',
    },
    milestones: [
      'Portion accuracy: 10/10 ingredients from §3.1',
      'SS Bowl rule: zero egg cracked directly into wok',
      'SOP awareness: 3 escalation scenarios explained',
      'Checklist independence: opening or closing without prompting',
    ],
    milestonesByRole: {
      cook: [
        'Portion accuracy: 10/10 ingredients from §3.1',
        'SS Bowl rule: zero egg cracked directly into wok',
        'Plate your first orders under supervision',
        'Complete opening or closing checklist without prompting',
      ],
      cashier: [
        'Read back every POS order accurately',
        'Process 10+ transactions under supervision',
        'Practice complaint response script (SOP §12.1)',
        'Complete opening or closing checklist without prompting',
      ],
      supervisor: [
        'SOP awareness: 3 escalation scenarios explained',
        'Observe full opening and closing routines',
        'Practice complaint response via role-play',
        'Complete HACCP temperature log independently',
      ],
    },
    sections: [
      {
        id: 'day-1',
        title: 'Day 1 — First Impressions',
        subtitle: 'All roles',
        tasks: [
          {
            id: 'p1-d1-t1',
            title: 'Warm welcome by Supervisor at outlet entrance',
            titleHire: 'Meet your supervisor and team at the outlet entrance',
            howTo:
              'SUP greets by name, introduces to the team, walks the full outlet before the station.',
            howToHire:
              'Your supervisor will greet you by name, introduce you to the team, and walk the full outlet before your station.',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p1-d1-t2',
            title:
              'Tour: kitchen, storage, chiller, POS, customer area, toilets',
            titleHire: 'Complete your outlet tour with your supervisor',
            howTo:
              'Point out SS bowl location, Quack Sos storage, and temperature log.',
            howToHire:
              'Note the SS bowl location, Quack Sos storage, and temperature log during your walkthrough.',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p1-d1-t3',
            title: 'Brand values conversation (not a lecture)',
            titleHire: 'Learn Quackteow brand values with your supervisor',
            howTo:
              "Discuss Quackteow's origin, Quackmaster system, and the 'no eye-balling' culture.",
            howToHire:
              "Ask questions about Quackteow's origin, the Quackmaster system, and the 'no eye-balling' culture.",
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p1-d1-t4',
            title: 'Issue uniform, confirm fit, explain wear standards (SOP §3.3)',
            titleHire: 'Receive your uniform and confirm fit (SOP §3.3)',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p1-d1-t5',
            title: 'SOP orientation: walk through Sections 3 and 4 together',
            titleHire: 'Complete SOP orientation on portions and food safety (§3 & §4)',
            howTo:
              'Read §3.1 (portions) and §4 (food safety) aloud. Ask comprehension questions.',
            howToHire:
              'Review §3.1 (portions) and §4 (food safety). Ask your supervisor if anything is unclear.',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p1-d1-t6',
            title: 'Introduce the Buddy — first meal together (outlet provides)',
            titleHire: 'Meet your buddy over your first team meal',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p1-d1-t7',
            title: "End-of-Day 1 check-in: 'How are you feeling? What was confusing?'",
            titleHire: 'Complete your Day 1 check-in with your supervisor',
            whyItMatters: 'Early warning signals for onboarding gaps.',
            whyItMattersHire:
              'Share anything confusing so your team can support you in Week 1.',
            owner: 'SUP',
            roles: ['all'],
          },
        ],
      },
      {
        id: 'days-2-3',
        title: 'Days 2–3 — Observation Phase',
        subtitle: 'Shadow only — no food, POS, or cash',
        tasks: [
          {
            id: 'p1-d23-t1',
            title: 'Shadow experienced cook for full service (Kitchen)',
            titleHire: 'Shadow an experienced cook for a full service shift',
            howTo:
              'Stand beside cook for entire shift. Count portions aloud for each order.',
            howToHire:
              'Stand beside the cook for the full shift. Count portions aloud for each order.',
            owner: 'SUP',
            roles: ['cook'],
          },
          {
            id: 'p1-d23-t2',
            title: 'Shadow cashier for full service (FOH)',
            titleHire: 'Shadow an experienced cashier for a full service shift',
            howTo:
              'Read back each POS entry. Observe complaint response (SOP §12.1).',
            howToHire:
              'Read back each POS entry. Watch how complaints are handled (SOP §12.1).',
            owner: 'SUP',
            roles: ['cashier'],
          },
          {
            id: 'p1-d23-t3',
            title: 'Observe the full opening checklist being completed',
            titleHire: 'Observe the full opening checklist with your supervisor',
            howTo:
              'Supervisor explains WHY each item matters, not just ticking it.',
            howToHire:
              'Ask why each opening item matters — not just what to tick.',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p1-d23-t4',
            title: 'Observe closing checklist and cash reconciliation',
            titleHire: 'Observe closing checklist and cash reconciliation',
            howTo:
              "Watch end-of-day reconciliation (SOP §11.3). Discuss variance scenarios.",
            howToHire:
              'Watch end-of-day reconciliation (SOP §11.3) and discuss variance scenarios.',
            owner: 'SUP',
            roles: ['cashier', 'supervisor'],
          },
          {
            id: 'p1-d23-t5',
            title: 'Observe temperature log completion (SOP §4.2)',
            titleHire: 'Learn how to complete the temperature log (SOP §4.2)',
            howTo:
              'Learn probe thermometer use, breach identification, and response.',
            howToHire:
              'Practice probe thermometer use, breach identification, and response steps.',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p1-d23-t6',
            title:
              "End-of-Day 2 & 3 debrief: 'What surprised you?'",
            titleHire: 'Complete your Day 2 & 3 debrief with your supervisor',
            owner: 'SUP',
            roles: ['all'],
          },
        ],
      },
      {
        id: 'days-4-7',
        title: 'Days 4–7 — Assisted Practice',
        subtitle: 'Tasks under direct supervision',
        tasks: [
          {
            id: 'p1-d47-t1',
            title: 'Cook first plate under direct supervision (Kitchen)',
            titleHire: 'Cook your first plate under direct supervision',
            howTo:
              'Stop if egg is not pre-cracked into SS bowl. Restart if needed.',
            howToHire:
              'Stop if your egg is not pre-cracked into the SS bowl. Restart if needed.',
            owner: 'SUP',
            roles: ['cook'],
          },
          {
            id: 'p1-d47-t2',
            title: 'Process first 10 POS transactions under supervision (FOH)',
            titleHire: 'Process your first 10 POS transactions under supervision',
            owner: 'SUP',
            roles: ['cashier'],
          },
          {
            id: 'p1-d47-t3',
            title:
              'Complete opening checklist independently (supervisor observing silently)',
            titleHire: 'Complete the opening checklist independently',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p1-d47-t4',
            title: 'Practice speed targets: cook to 90-second target (Kitchen)',
            titleHire: 'Practice your 90-second plate speed target',
            howTo:
              'Time each plate. Aim for 3 consecutive plates within target before Week 1 ends.',
            howToHire:
              'Time each plate. Aim for 3 consecutive plates within target before Week 1 ends.',
            owner: 'SUP',
            roles: ['cook'],
          },
          {
            id: 'p1-d47-t5',
            title: 'Practice complaint response script (SOP §12.1) via role-play',
            titleHire: 'Practice the customer complaint script (SOP §12.1)',
            owner: 'SUP',
            roles: ['cashier', 'supervisor'],
          },
          {
            id: 'p1-d47-t6',
            title: 'Complete end-of-day cash reconciliation under supervision (FOH)',
            titleHire: 'Complete end-of-day cash reconciliation under supervision',
            owner: 'SUP',
            roles: ['cashier'],
          },
          {
            id: 'p1-d47-t7',
            title: 'Complete HACCP temperature log entry independently',
            titleHire: 'Complete your HACCP temperature log entry independently',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p1-d47-t8',
            title:
              'End-of-Week 1: Competency check against Appendix E (Training Sign-Off)',
            titleHire: 'Complete your Week 1 competency check (Appendix E)',
            howTo: 'Pass = proceed. Fail = extend practice. GM signs the form.',
            howToHire:
              'Your supervisor and GM will assess you against Appendix E. Pass to move to Days 8–30.',
            owner: 'GM',
            roles: ['all'],
          },
        ],
      },
    ],
  },
  {
    id: 'phase-2',
    number: 2,
    title: '30-Day Integration',
    subtitle: 'Days 8–30',
    dayRange: 'Days 8–30',
    description:
      'Independent operation under guidance. Build speed, accuracy, and consistency.',
    descriptionByRole: {
      cook:
        'Build kitchen speed and consistency while maintaining food safety every shift.',
      cashier:
        'Build POS accuracy, cash control, and customer service under guidance.',
      supervisor:
        'Build floor leadership habits: complaints, checklists, and team standards.',
    },
    milestones: [
      'Zero food safety violations across all shifts',
      'Plate time ≤ 90 sec (TTDI/PJ/Hartamas) for 5 consecutive sessions',
      'Cash variance within RM5 for 10 consecutive closings',
      'Order accuracy ≥ 95% across 30 days',
    ],
    milestonesByRole: {
      cook: [
        'Zero food safety violations across all shifts',
        'Plate time ≤ 90 sec for 5 consecutive sessions',
        'Cook independently during off-peak periods',
      ],
      cashier: [
        'Order accuracy ≥ 95% across 30 days',
        'Cash variance within RM5 for 10 consecutive closings',
        'Handle your first real customer complaint using §12.1',
      ],
      supervisor: [
        'Zero food safety violations across all shifts',
        'Handle customer complaints using §12.1 script',
        'First peak shift under supervision completed',
      ],
    },
    sections: [
      {
        id: 'days-8-30',
        title: 'Days 8–30 Checklist',
        tasks: [
          {
            id: 'p2-t1',
            title:
              'Cook independently during off-peak — supervisor monitors from distance',
            titleHire: 'Cook independently during off-peak (supervisor on standby)',
            owner: 'SUP',
            roles: ['cook'],
          },
          {
            id: 'p2-t2',
            title:
              'Achieve 3 consecutive shifts at or above speed KPI (60–90 sec/plate)',
            titleHire:
              'Hit your speed KPI (60–90 sec/plate) for 3 consecutive shifts',
            owner: 'SUP',
            roles: ['cook'],
          },
          {
            id: 'p2-t3',
            title: 'Zero wrong orders in a full service week',
            titleHire: 'Complete a full service week with zero wrong orders',
            whyItMatters: 'Order accuracy ≥ 95% is the minimum KPI (SOP §16.2).',
            whyItMattersHire:
              'Order accuracy ≥ 95% is your minimum KPI (SOP §16.2).',
            owner: 'SUP',
            roles: ['cashier'],
          },
          {
            id: 'p2-t4',
            title:
              'Complete temperature log independently and correctly every shift',
            titleHire:
              'Complete your temperature log independently and correctly every shift',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p2-t5',
            title: 'Handle first real customer complaint using §12.1 script',
            titleHire: 'Handle your first real customer complaint using §12.1',
            owner: 'SUP',
            roles: ['cashier', 'supervisor'],
          },
          {
            id: 'p2-t6',
            title:
              'Complete solo end-of-day cash reconciliation with variance within RM5',
            titleHire:
              'Complete solo end-of-day cash reconciliation within RM5 variance',
            owner: 'SUP',
            roles: ['cashier'],
          },
          {
            id: 'p2-t7',
            title:
              'Understand and explain the KPI bonus system verbally (SOP §16.4)',
            titleHire:
              'Explain the KPI bonus system in your own words (SOP §16.4)',
            owner: 'HIRE',
            roles: ['all'],
          },
          {
            id: 'p2-t8',
            title: 'Par level check: know when stock is at par and how to reorder',
            titleHire: 'Complete a par level check and know when to reorder',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p2-t9',
            title: 'First peak shift under supervision (SOP §13)',
            titleHire: 'Complete your first peak shift under supervision (SOP §13)',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p2-t10',
            title:
              'Social media policy briefing and acknowledgement sign-off (SOP §18.4)',
            titleHire:
              'Review and sign the social media policy acknowledgement (SOP §18.4)',
            owner: 'GM',
            roles: ['all'],
          },
          {
            id: 'p2-t11',
            title: 'Day 15 — Mid-point check-in with supervisor',
            titleHire: 'Attend your Day 15 mid-point check-in with your supervisor',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p2-t12',
            title: 'Day 30 — Formal 30-day review with GM',
            titleHire: 'Attend your Day 30 formal review with the GM',
            owner: 'GM',
            roles: ['all'],
          },
        ],
      },
    ],
  },
  {
    id: 'phase-3',
    number: 3,
    title: '60-Day Consolidation',
    subtitle: 'Days 31–60',
    dayRange: 'Days 31–60',
    description:
      'Move from doing the job correctly to owning the job. Peak performance and team contribution.',
    descriptionByRole: {
      cook:
        'Own your station during peak service and contribute to kitchen KPIs.',
      cashier:
        'Own front-of-house accuracy during peak and contribute to order quality KPIs.',
      supervisor:
        'Step into leadership moments: briefings, buddy support, and outlet standards.',
    },
    milestones: [
      '100% temperature log completion Days 31–60',
      '3 service sessions hitting daily plate target (Kitchen)',
      'Zero wrong order escalations Days 31–60',
      'Complete full 86 procedure at least once',
    ],
    milestonesByRole: {
      cook: [
        '100% temperature log completion Days 31–60',
        '3 service sessions hitting daily plate target',
        'Complete full 86 procedure at least once',
      ],
      cashier: [
        'Zero wrong order escalations Days 31–60',
        '100% temperature log completion Days 31–60',
        'First unsupervised peak period completed',
      ],
      supervisor: [
        'Lead opening checklist as most senior staff at least once',
        'Assist in one staff onboarding activity (buddy role)',
        'Complete full 86 procedure simulation',
      ],
    },
    sections: [
      {
        id: 'days-31-60',
        title: 'Days 31–60 Checklist',
        tasks: [
          {
            id: 'p3-t1',
            title:
              'First unsupervised peak period (supervisor on standby, not on floor)',
            titleHire:
              'Complete your first unsupervised peak period (supervisor on standby)',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p3-t2',
            title:
              'Achieve KPI bonus Level 2 (Good Performance) for at least one week',
            titleHire: 'Achieve KPI bonus Level 2 for at least one week',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p3-t3',
            title:
              'Lead the opening checklist as most senior staff present at least once',
            titleHire:
              'Lead the opening checklist as most senior staff at least once',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p3-t4',
            title:
              'Demonstrate equipment fault reporting (SOP §14.2)',
            titleHire: 'Report an equipment fault correctly (SOP §14.2)',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p3-t5',
            title:
              'Contribute to at least one reorder to Quackmaster',
            titleHire: 'Contribute to at least one Quackmaster reorder',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p3-t6',
            title:
              'Shadow or assist in one staff onboarding activity (buddy role)',
            titleHire: 'Assist in one staff onboarding activity as a buddy',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p3-t7',
            title: 'Complete full 86 procedure simulation (SOP §15.2)',
            titleHire: 'Complete the full 86 procedure simulation (SOP §15.2)',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p3-t8',
            title:
              'Review and acknowledge social media policy in writing (if not done Day 30)',
            titleHire:
              'Complete your written social media policy acknowledgement (if not done at Day 30)',
            owner: 'GM',
            roles: ['all'],
          },
          {
            id: 'p3-t9',
            title: 'Day 45 — Mid-point check-in with Supervisor (15 min)',
            titleHire: 'Attend your Day 45 mid-point check-in with your supervisor',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p3-t10',
            title: 'Day 60 — Formal 60-day review with GM',
            titleHire: 'Attend your Day 60 formal review with the GM',
            owner: 'GM',
            roles: ['all'],
          },
        ],
      },
    ],
  },
  {
    id: 'phase-4',
    number: 4,
    title: '90-Day Performance Review',
    subtitle: 'Days 61–90',
    dayRange: 'Days 61–90',
    description:
      'Full integration, contribution, and evaluation. Day 90 is the beginning of employment.',
    descriptionByRole: {
      cook:
        'Prove full kitchen independence and hit your personal speed KPIs through Day 90.',
      cashier:
        'Prove full FOH independence and cash accuracy through Day 90.',
      supervisor:
        'Prove leadership readiness including shift briefings and team contribution.',
    },
    milestones: [
      '100% shift attendance Days 61–90',
      'Personal plate speed KPI every service shift',
      'Zero cash variance above RM5 (30 closings)',
      'Outlet KPI L2 for minimum 3 weeks',
    ],
    milestonesByRole: {
      cook: [
        '100% shift attendance Days 61–90',
        'Personal plate speed KPI every service shift',
        'Demonstrate FIFO, SS bowl, and 86 without prompting',
      ],
      cashier: [
        '100% shift attendance Days 61–90',
        'Zero cash variance above RM5 (30 closings)',
        'Complete Day 90 self-assessment before formal review',
      ],
      supervisor: [
        'Lead a full shift briefing at least once',
        'Contribute to outlet KPI L2 for at least 3 weeks',
        'Complete Day 90 self-assessment before formal review',
      ],
    },
    sections: [
      {
        id: 'days-61-90',
        title: 'Days 61–90 Checklist',
        tasks: [
          {
            id: 'p4-t1',
            title:
              'Operate as fully independent team member for entire 30-day period',
            titleHire:
              'Operate as a fully independent team member for the full 30-day period',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p4-t2',
            title:
              'Contribute to outlet reaching KPI L2 for at least 3 full weeks',
            titleHire:
              'Contribute to your outlet reaching KPI L2 for at least 3 full weeks',
            owner: 'ALL',
            roles: ['all'],
          },
          {
            id: 'p4-t3',
            title:
              'Complete at least one inventory count and par level reconciliation',
            titleHire:
              'Complete at least one inventory count and par level reconciliation',
            owner: 'HIRE',
            roles: ['all'],
          },
          {
            id: 'p4-t4',
            title:
              'Demonstrate 3 unprompted SOP-correct behaviours (FIFO, SS bowl, 86)',
            titleHire:
              'Demonstrate 3 unprompted SOP-correct behaviours (FIFO, SS bowl, 86)',
            owner: 'SUP',
            roles: ['all'],
          },
          {
            id: 'p4-t5',
            title:
              'If Supervisor track: lead a full shift briefing at least once',
            titleHire: 'Lead a full shift briefing at least once',
            owner: 'SUP',
            roles: ['supervisor'],
          },
          {
            id: 'p4-t6',
            title: 'Complete Day 90 self-assessment before formal review',
            titleHire: 'Complete your Day 90 self-assessment before formal review',
            owner: 'HIRE',
            roles: ['all'],
          },
          {
            id: 'p4-t7',
            title: 'Day 90 — Formal review with GM and EXCO observation',
            titleHire: 'Attend your Day 90 formal review with the GM and EXCO',
            owner: 'GM',
            roles: ['all'],
          },
          {
            id: 'p4-t8',
            title:
              'Confirm employment in writing — contract renewal or permanent appointment',
            owner: 'EXCO',
            roles: ['all'],
            audience: 'internal',
          },
          {
            id: 'p4-t9',
            title:
              'Discuss compensation review if applicable (SOP §18.1 quarterly cycle)',
            owner: 'EXCO',
            roles: ['all'],
            audience: 'internal',
          },
        ],
      },
    ],
  },
]

export const resources: Resource[] = [
  {
    id: 'doc-a',
    title: 'Universal Cooking Sequence',
    description: 'Step-by-step cooking order for every plate.',
    category: 'document',
    reference: 'QT-SOP-OPS-002 v3.0 — Appendix A',
    url: 'https://quackteow.com/sop/appendix-a-cooking-sequence',
    roles: ['cook', 'supervisor'],
  },
  {
    id: 'doc-b',
    title: 'Portion Reference Card',
    description: 'Exact portions for all 10 ingredients (§3.1).',
    category: 'document',
    reference: 'QT-SOP-OPS-002 v3.0 — Appendix B',
    url: 'https://quackteow.com/sop/appendix-b-portion-card',
    roles: ['cook', 'supervisor'],
  },
  {
    id: 'doc-c',
    title: 'Temperature Log',
    description: 'HACCP temperature recording template.',
    category: 'document',
    reference: 'QT-SOP-OPS-002 v3.0 — Appendix C',
    url: 'https://quackteow.com/sop/appendix-c-temperature-log',
    roles: ['all'],
  },
  {
    id: 'doc-d',
    title: 'Customer Incident Report',
    description: 'Form for logging customer complaints and incidents.',
    category: 'document',
    reference: 'QT-SOP-OPS-002 v3.0 — Appendix D',
    url: 'https://quackteow.com/sop/appendix-d-incident-report',
    roles: ['cashier', 'supervisor'],
  },
  {
    id: 'doc-e',
    title: 'Training Sign-Off Form',
    description: 'Week 1 competency assessment checklist.',
    category: 'training',
    reference: 'QT-SOP-OPS-002 v3.0 — Appendix E',
    url: 'https://quackteow.com/sop/appendix-e-training-signoff',
    roles: ['all'],
  },
  {
    id: 'doc-sop',
    title: 'Operations SOP (Full Document)',
    description: 'Master standard operating procedures for all outlets.',
    category: 'document',
    reference: 'QT-SOP-OPS-002 v3.0',
    url: 'https://quackteow.com/sop/qt-sop-ops-002',
    roles: ['all'],
  },
  {
    id: 'policy-social',
    title: 'Social Media Policy',
    description: 'Required acknowledgement by Day 30.',
    category: 'policy',
    reference: 'QT-SOP-OPS-002 v3.0 — Section 18.4',
    url: 'https://quackteow.com/sop/section-18-4-social-media',
    roles: ['all'],
  },
  {
    id: 'policy-food-safety',
    title: 'Food Safety & HACCP (Section 4)',
    description: 'Temperature logs, FIFO, SS bowl rule, and breach response.',
    category: 'policy',
    reference: 'QT-SOP-OPS-002 v3.0 — Section 4',
    url: 'https://quackteow.com/sop/section-4-food-safety',
    roles: ['all'],
  },
  {
    id: 'policy-complaints',
    title: 'Customer Complaint Response (§12.1)',
    description: '5-step script for handling unhappy customers.',
    category: 'training',
    reference: 'QT-SOP-OPS-002 v3.0 — Section 12.1',
    url: 'https://quackteow.com/sop/section-12-1-complaints',
    roles: ['cashier', 'supervisor'],
  },
  {
    id: 'policy-kpi',
    title: 'KPI & Bonus System (§16.4)',
    description: 'Performance targets and bonus Level 2 criteria.',
    category: 'training',
    reference: 'QT-SOP-OPS-002 v3.0 — Section 16.4',
    url: 'https://quackteow.com/sop/section-16-4-kpi-bonus',
    roles: ['all'],
  },
]

export const contacts: ContactPerson[] = [
  {
    id: 'contact-exco',
    name: 'Executive Committee',
    role: 'EXCO',
    ownerCode: 'EXCO',
    responsibility:
      'Final approval, policy, compensation decisions, welcome message',
    contactHint: 'Via GM / PA for scheduling',
  },
  {
    id: 'contact-gm',
    name: 'General Manager (PA)',
    role: 'GM',
    ownerCode: 'GM',
    responsibility:
      'Onboarding coordination, competency sign-off, formal reviews',
    contactHint: 'Outlet WhatsApp group — tag @GM',
  },
  {
    id: 'contact-sup',
    name: 'Outlet Supervisor',
    role: 'SUP',
    ownerCode: 'SUP',
    responsibility: 'Daily training, checklist supervision, real-time coaching',
    contactHint: 'On-floor during your shift',
  },
  {
    id: 'contact-buddy',
    name: 'Assigned Buddy',
    role: 'Peer support',
    ownerCode: 'HIRE',
    responsibility: 'Day-to-day questions, cultural integration, first-week support',
    contactHint: 'See your buddy assignment on Day 1',
  },
]

export const feedbackSchedule = [
  { day: 'Day 1', dayNumber: 1, method: 'Verbal check-in (5 min)', owner: 'SUP' },
  { day: 'Day 3', dayNumber: 3, method: 'Buddy debrief (10 min)', owner: 'SUP' },
  { day: 'Day 7', dayNumber: 7, method: 'Competency sign-off (Appendix E)', owner: 'GM' },
  { day: 'Day 15', dayNumber: 15, method: 'Mid-point check-in (15 min)', owner: 'SUP' },
  { day: 'Day 30', dayNumber: 30, method: 'Formal review + hire survey', owner: 'GM' },
  { day: 'Day 45', dayNumber: 45, method: 'Informal pulse check (10 min)', owner: 'SUP' },
  { day: 'Day 60', dayNumber: 60, method: 'Formal review + hire survey', owner: 'GM' },
  { day: 'Day 90', dayNumber: 90, method: 'Formal review + self-assessment', owner: 'GM + EXCO' },
]
