import type { AppData } from '../types';
import { localDateKey, uid } from '../lib/util';

/**
 * Example content for first use only. Every item is editable or deletable in the UI.
 * This is written to localStorage once, when no saved data exists. It never overwrites saved data.
 */
export function createSeedData(): AppData {
  const today = localDateKey();
  return {
    settings: {
      kanbanUrl: '',
      timerUrl: '',
      hideCompletedAdmin: false,
      lastExportedAt: null,
    },
    mainQuest: {
      projectTitle: 'My Video Game',
      nextAction: 'Write the six opening dialogue paragraphs.',
      context: 'Just a first pass. Rough is fine. It only has to exist so I can edit it tomorrow.',
    },
    wins: [],
    sideQuests: [
      {
        id: uid(),
        title: 'Create a pixel-art character portrait',
        description: 'A 64×64 face. One evening, no polish.',
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
      {
        id: uid(),
        title: 'Compose an eight-bar village theme',
        description: '',
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
    ],
    trophies: [
      {
        id: uid(),
        title: 'First finished pixel-art portrait',
        date: today,
        description: 'Example trophy. Edit or remove it, then add your own finished work.',
        image: null,
        link: '',
      },
    ],
    characterAreas: [
      {
        id: uid(),
        title: 'Resilience and Stoicism',
        objective: 'Stay steady when things go wrong, and respond rather than react.',
        status: 'active',
        actions: [
          { id: uid(), text: 'Practise responding calmly during difficult conversations', done: false },
          { id: uid(), text: 'Pause for three breaths before replying when irritated', done: false },
        ],
        reflections: [],
        resources: [{ id: uid(), title: 'Meditations — Marcus Aurelius', url: '' }],
      },
      {
        id: uid(),
        title: 'Communication',
        objective: 'Say what I mean clearly and share my work with confidence.',
        status: 'active',
        actions: [
          { id: uid(), text: 'Share one work-in-progress with someone this month', done: false },
        ],
        reflections: [],
        resources: [],
      },
      {
        id: uid(),
        title: 'Learning and intellectual growth',
        objective: 'Read and learn deliberately, and follow my curiosity somewhere new.',
        status: 'active',
        actions: [
          { id: uid(), text: 'Read twenty pages of the current book', done: false },
        ],
        reflections: [],
        resources: [],
      },
      {
        id: uid(),
        title: 'Personal style',
        objective: 'Dress in a way that feels deliberate and unmistakably mine.',
        status: 'archived',
        actions: [{ id: uid(), text: 'Pick three outfits I feel great in', done: false }],
        reflections: [],
        resources: [],
      },
    ],
    adminTasks: [
      { id: uid(), text: 'Call the ophthalmologist', done: false },
      { id: uid(), text: 'Renew the annual transport pass', done: false },
    ],
  };
}
