import { describe, it, expect } from 'vitest';
import {
  buildNodeTree,
  createNullNode,
  createDateNode,
  createPrimitiveNode,
  createArrayNode,
  createObjectNode,
  destroyNodeTree,
} from '../node/node-builder.util';
import type { ObjectNodeData } from '../../types';

describe('node-builder.util', () => {
  describe('createNullNode', () => {
    it('should create a null node', () => {
      const node = createNullNode('testKey');
      expect(node.type).toBe('null');
      expect(node.key).toBe('testKey');
      expect(node.value).toBe(null);
      expect(node.transforms).toEqual([]);
      expect(node.id).toBeDefined();
    });
  });

  describe('createDateNode', () => {
    it('should create a date node', () => {
      const date = new Date('2023-01-01');
      const node = createDateNode(date, 'dateKey');
      expect(node.type).toBe('date');
      expect(node.key).toBe('dateKey');
      expect(node.value).toBe(date);
    });
  });

  describe('createPrimitiveNode', () => {
    it('should create string node', () => {
      const node = createPrimitiveNode('hello', 'strKey');
      expect(node.type).toBe('string');
      expect(node.value).toBe('hello');
    });

    it('should create number node', () => {
      const node = createPrimitiveNode(42, 'numKey');
      expect(node.type).toBe('number');
      expect(node.value).toBe(42);
    });

    it('should create boolean node', () => {
      const node = createPrimitiveNode(true, 'boolKey');
      expect(node.type).toBe('boolean');
      expect(node.value).toBe(true);
    });
  });

  describe('createArrayNode', () => {
    it('should create an array node with children', () => {
      const items = [1, 2, 3];
      const node = createArrayNode(items, buildNodeTree, 'arrayKey');

      expect(node.type).toBe('array');
      expect(node.key).toBe('arrayKey');
      expect(node.children).toHaveLength(3);
      expect(node.value).toEqual([1, 2, 3]);

      node.children!.forEach((child: ObjectNodeData, index: number) => {
        expect(child.key).toBe(String(index));
        expect(child.parent).toBe(node);
      });
    });

    it('should create empty array node', () => {
      const node = createArrayNode([], buildNodeTree, 'emptyArray');
      expect(node.children).toEqual([]);
      expect(node.value).toEqual([]);
    });
  });

  describe('createObjectNode', () => {
    it('should create an object node with children', () => {
      const obj = { name: 'John', age: 30 };
      const node = createObjectNode(obj, buildNodeTree, 'objKey');

      expect(node.type).toBe('object');
      expect(node.key).toBe('objKey');
      expect(node.children).toHaveLength(2);

      const nameChild = node.children!.find((c: ObjectNodeData) => c.key === 'name');
      const ageChild = node.children!.find((c: ObjectNodeData) => c.key === 'age');

      expect(nameChild?.value).toBe('John');
      expect(ageChild?.value).toBe(30);
    });
  });

  describe('buildNodeTree', () => {
    it('should build tree for primitive', () => {
      const node = buildNodeTree('test', 'key');
      expect(node.type).toBe('string');
      expect(node.value).toBe('test');
    });

    it('should build tree for null', () => {
      const node = buildNodeTree(null, 'key');
      expect(node.type).toBe('null');
      expect(node.value).toBe(null);
    });

    it('should build tree for date', () => {
      const date = new Date();
      const node = buildNodeTree(date, 'key');
      expect(node.type).toBe('date');
      expect(node.value).toBe(date);
    });

    it('should build tree for array', () => {
      const node = buildNodeTree([1, 'two', true]);
      expect(node.type).toBe('array');
      expect(node.children).toHaveLength(3);
      expect(node.children![0].type).toBe('number');
      expect(node.children![1].type).toBe('string');
      expect(node.children![2].type).toBe('boolean');
    });

    it('should build tree for nested object', () => {
      const data = {
        user: {
          name: 'Alice',
          age: 25,
        },
        tags: ['vue', 'typescript'],
      };

      const node = buildNodeTree(data, 'root');
      expect(node.type).toBe('object');
      expect(node.children).toHaveLength(2);

      const userNode = node.children!.find((c: ObjectNodeData) => c.key === 'user');
      expect(userNode?.type).toBe('object');
      expect(userNode?.children).toHaveLength(2);

      const tagsNode = node.children!.find((c: ObjectNodeData) => c.key === 'tags');
      expect(tagsNode?.type).toBe('array');
      expect(tagsNode?.children).toHaveLength(2);
    });
  });

  describe('destroyNodeTree', () => {
    it('should clear circular references', () => {
      const node = buildNodeTree({ a: 1, b: 2 });
      expect(node.children).toBeDefined();
      expect(node.children![0].parent).toBe(node);

      destroyNodeTree(node);

      expect(node.children).toBeUndefined();
      expect(node.transforms).toEqual([]);
    });
  });
});
