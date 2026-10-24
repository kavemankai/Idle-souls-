import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Lifecycle } from '../src/platform/lifecycle';
import { ExpeditionAudio } from '../src/ui/audioCues';

test('all lifecycle sources must resume; duplicate signals do not restart playback', () => {
  const lifecycle = new Lifecycle(), states: boolean[] = [];
  const dispose = lifecycle.subscribe(active => states.push(active));
  lifecycle.setActive('native', false);
  lifecycle.setActive('document', false);
  lifecycle.setActive('native', true);
  assert.equal(lifecycle.active, false);
  lifecycle.setActive('document', true);
  lifecycle.setActive('document', true);
  assert.deepEqual(states, [true, false, true]);
  dispose(); lifecycle.setActive('native', false);
  assert.equal(states.length, 3);
});

test('Back delegates to the current screen and old cleanup cannot remove its replacement', () => {
  const lifecycle = new Lifecycle();
  assert.equal(lifecycle.requestBack(), false);
  const old = lifecycle.onBack(() => false);
  const current = lifecycle.onBack(() => true);
  old(); assert.equal(lifecycle.requestBack(), true);
  current(); assert.equal(lifecycle.requestBack(), false);
});

test('audio interruption preserves preference and silences effects without replaying them', () => {
  const original = globalThis.Audio;
  const instances: FakeAudio[] = [];
  class FakeAudio {
    plays = 0; pauses = 0; volume = 0; loop = false; preload = '';
    constructor(public src: string) { instances.push(this); }
    play() { this.plays++; return Promise.resolve(); }
    pause() { this.pauses++; }
    addEventListener() {}
  }
  globalThis.Audio = FakeAudio as unknown as typeof Audio;
  try {
    const audio = new ExpeditionAudio();
    audio.enable(); audio.cue('retreat');
    audio.setSuspended(true);
    assert.equal(audio.enabled, true);
    assert.ok(instances.every(a => a.pauses === 1));
    audio.cue('retreat');
    assert.equal(instances.length, 2);
    assert.equal(audio.played.at(-1)?.sounded, false);
    audio.setSuspended(false);
    assert.equal(instances[0].plays, 2);
    assert.equal(instances[1].plays, 1);
    audio.disable(); audio.setSuspended(true); audio.setSuspended(false);
    assert.equal(instances[0].plays, 2);
  } finally { globalThis.Audio = original; }
});
