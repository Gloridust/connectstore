import { describe, it, expect, beforeEach } from 'vitest';
import {
  getState,
  createProject,
  deleteProject,
  duplicateProjectById,
  serializeState,
  importState,
  uid,
} from './storage';

beforeEach(() => {
  // start each test from a clean store
  importState({ version: 1, projects: {}, currentProjectId: null }, 'replace');
});

describe('uid', () => {
  it('produces unique, prefixed ids', () => {
    const a = uid('p');
    const b = uid('p');
    expect(a).not.toBe(b);
    expect(a.startsWith('p_')).toBe(true);
  });
});

describe('project CRUD', () => {
  it('creates and selects a project', () => {
    const id = createProject('My App');
    const s = getState();
    expect(s.projects[id].name).toBe('My App');
    expect(s.currentProjectId).toBe(id);
  });

  it('duplicates a project with a new id and " copy" suffix', () => {
    const id = createProject('Orig');
    const dupId = duplicateProjectById(id);
    expect(dupId).not.toBe(id);
    expect(getState().projects[dupId].name).toBe('Orig copy');
  });

  it('reassigns currentProject after deleting the active one', () => {
    const a = createProject('A');
    const b = createProject('B');
    deleteProject(b);
    expect(getState().currentProjectId).toBe(a);
  });
});

describe('serialize / import', () => {
  it('serializes to valid JSON', () => {
    createProject('Backup me');
    const json = serializeState();
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json).projects).toBeTruthy();
  });

  it('rejects non-JSON input', () => {
    expect(importState('not json {{').ok).toBe(false);
  });

  it('rejects objects that are not ConnectStore backups', () => {
    expect(importState({ hello: 'world' }).ok).toBe(false);
  });

  it('merge keeps existing projects and adds imported ones', () => {
    createProject('Existing');
    const before = Object.keys(getState().projects).length;
    const backup = {
      projects: { p_x: { id: 'p_x', name: 'Imported', createdAt: 1, updatedAt: 1, posters: [] } },
    };
    const res = importState(backup, 'merge');
    expect(res.ok).toBe(true);
    expect(Object.keys(getState().projects).length).toBe(before + 1);
  });

  it('replace wipes existing projects first', () => {
    createProject('Will be gone');
    importState(
      { projects: { p_y: { id: 'p_y', name: 'Only one', posters: [] } } },
      'replace',
    );
    const names = Object.values(getState().projects).map((p) => p.name);
    expect(names).toEqual(['Only one']);
  });

  it('avoids clobbering when an imported id already exists (merge)', () => {
    const id = createProject('Keep');
    const realId = getState().currentProjectId;
    const backup = {
      projects: { [realId]: { id: realId, name: 'Clashing', posters: [] } },
    };
    importState(backup, 'merge');
    // original survives, clash gets a fresh id -> 2 projects
    expect(Object.keys(getState().projects).length).toBe(2);
    expect(getState().projects[id].name).toBe('Keep');
  });
});
