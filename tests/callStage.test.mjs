import test from 'node:test';
import assert from 'node:assert/strict';
import { findPresenter, isPresenterTile, presenterLabel } from '../src/chat/callStage.js';

const streamFor = name => ({ id: name });
const bob = { userId: 'u-bob', user: { name: 'Bob' }, stream: streamFor('bob') };
const carol = { userId: 'u-carol', user: { name: 'Carol' }, stream: streamFor('carol') };

test('nobody presents while no screen is shared', () => {
    assert.equal(findPresenter([bob, carol], null), null);
    assert.equal(findPresenter([bob, carol], ''), null);
    assert.equal(presenterLabel(null), '');
});

test('the sharer becomes the presenter and only their tile is the stage', () => {
    const presenter = findPresenter([bob, carol], 'u-bob');
    assert.equal(presenter.userId, 'u-bob');
    assert.equal(presenterLabel(presenter), 'Bob is presenting');
    assert.equal(isPresenterTile(bob, presenter), true);
    assert.equal(isPresenterTile(carol, presenter), false);
});

test('a share announced before the video arrives keeps the normal grid', () => {
    const presenter = findPresenter([{ userId: 'u-bob', user: { name: 'Bob' }, stream: null }, carol], 'u-bob');
    assert.equal(presenter, null);
});

test('a sharer who left the call stops being the presenter', () => {
    assert.equal(findPresenter([carol], 'u-bob'), null);
});

test('ids are compared as strings and an unnamed sharer still gets a label', () => {
    const presenter = findPresenter([{ userId: 42, user: null, stream: streamFor('n') }], '42');
    assert.equal(String(presenter.userId), '42');
    assert.equal(presenterLabel(presenter), 'Someone is presenting');
    assert.equal(isPresenterTile({ userId: '42' }, presenter), true);
});
