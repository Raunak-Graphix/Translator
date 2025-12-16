import { Script, TranslationHistoryItem } from '../types';

const DATA_KEY = 'unlisted_sync_local_data';

export const storageService = {
  getData: () => {
    const data = localStorage.getItem(DATA_KEY);
    return data ? JSON.parse(data) : { scripts: [], history: [] };
  },

  saveData: (data: { scripts?: Script[], history?: TranslationHistoryItem[] }) => {
    const currentData = storageService.getData();
    const newData = {
      ...currentData,
      ...data
    };
    localStorage.setItem(DATA_KEY, JSON.stringify(newData));
  },

  saveScript: (script: Script) => {
    const data = storageService.getData();
    const scripts = data.scripts || [];
    const index = scripts.findIndex((s: Script) => s.id === script.id);
    
    if (index >= 0) {
      scripts[index] = script;
    } else {
      scripts.unshift(script);
    }
    
    storageService.saveData({ scripts });
  },

  deleteScript: (scriptId: string) => {
    const data = storageService.getData();
    const scripts = (data.scripts || []).filter((s: Script) => s.id !== scriptId);
    storageService.saveData({ scripts });
  }
};