declare global {
  interface Window {
    ym?: (id: number, method: string, ...args: any[]) => void;
  }
}

const METRIKA_ID = 106655742;

export function trackGoal(goal: string, params?: Record<string, any>) {
  if (window.ym) {
    window.ym(METRIKA_ID, 'reachGoal', goal, params);
  }
}

export function trackButtonClick(buttonName: string) {
  trackGoal('button_click', { button: buttonName });
}

export function trackLinkClick(linkName: string, url: string) {
  trackGoal('link_click', { link: linkName, url });
}
