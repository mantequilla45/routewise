const LIST_ID = 'edit-points-list';

// Scrolls the points list so the point at `index` is centred.
export function scrollToPoint(index: number): void {
  setTimeout(() => {
    const pointsList = document.getElementById(LIST_ID);
    const element = document.querySelector(`#edit-point-${index}`);
    if (pointsList && element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
}

// Scrolls the points list so the last point is centred.
export function scrollToLastPoint(): void {
  setTimeout(() => {
    const pointsList = document.getElementById(LIST_ID);
    const points = pointsList?.querySelectorAll('[id^="edit-point-"]');
    if (points && points.length > 0) {
      const lastPoint = points[points.length - 1];
      lastPoint.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
}

// Scrolls the point at `index` into view only if it is outside the list's visible area.
export function scrollSelectedPointIntoView(index: number): void {
  setTimeout(() => {
    const pointsList = document.getElementById(LIST_ID);
    const selectedElement = document.querySelector(`#edit-point-${index}`);
    if (pointsList && selectedElement) {
      const listRect = pointsList.getBoundingClientRect();
      const elementRect = selectedElement.getBoundingClientRect();

      if (elementRect.top < listRect.top || elementRect.bottom > listRect.bottom) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, 50);
}
