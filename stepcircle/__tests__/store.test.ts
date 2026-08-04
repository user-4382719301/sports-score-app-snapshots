import { useAppStore } from '../src/store/useAppStore';

describe('useAppStore', () => {
  it('initializes from demo adapters into a coherent state', async () => {
    await useAppStore.getState().init();
    const state = useAppStore.getState();

    expect(state.ready).toBe(true);
    expect(state.history).toHaveLength(30);
    expect(state.today?.date).toBe(state.history[29].date);
    expect(state.friends.length).toBeGreaterThan(0);
    expect(state.competitions.length).toBeGreaterThan(0);
    expect(state.myId).toBe('me');
    expect(state.me?.friendCode).toBe('DEMO42');
  });

  it('recomputes on goal changes and adds friends', async () => {
    const before = useAppStore.getState().friends.length;
    const added = await useAppStore.getState().addFriend('ZZ99');
    expect(added).toBe(true);
    expect(useAppStore.getState().friends.length).toBe(before + 1);

    useAppStore.getState().setGoals({ steps: 1000, activeMinutes: 5, activeHours: 4 });
    expect(useAppStore.getState().goals.steps).toBe(1000);
  });
});
