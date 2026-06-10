import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'goalsFor', pure: false })
export class GoalsForPipe implements PipeTransform {
  transform(events: { type: string; team: string }[], teamName: string): number {
    if (!events) return 0;
    return events.filter(e => e.type === 'goal' && e.team === teamName).length;
  }
}