import { BehaviorSubject, Subject } from 'rxjs';
import produce from 'immer';

export default function createStore(model) {
  let currentState = model.state; // initial state
  const mutations = model.mutations;
  const intentSubSet = {};
  const uiRelatedActions = {};
  // 应用状态变更的 subject
  const $stateSub = new BehaviorSubject(currentState);

  if (mutations.setValues == null) {
    mutations.setValues = (model, payload) => {
      Object.keys(payload).forEach(key => {
        const value = payload[key];
        model[key] = value;
      });
    };
  }

  function getState() {
    return currentState;
  }

  function subscribe(cb) {
    $stateSub.subscribe(cb);
  }

  function $(type) {
    let $sub = intentSubSet[type];

    if ($sub == null) {
      $sub = new Subject();
      intentSubSet[type] = $sub;
    }

    return $sub;
  }

  // 提交一次状态变更
  function commit(type, payload) {
    // 如果是 ui: 开头
    if (/^ui:/.test(type)) {
      const uiRelatedAction = uiRelatedActions[type.replace(/^ui:/, '')];

      if (typeof uiRelatedAction === 'function') {
        uiRelatedAction(payload);

        return;
      }
    }

    const stateTransitionFn = mutations[type];

    if (typeof stateTransitionFn === 'function') {
      currentState = produce(currentState, draft => {
        stateTransitionFn(draft, payload);
      });
      $stateSub.next(currentState);
    }
  }

  function dispatch(type, payload) {
    const $sub = $(type);
    $sub.next(payload);
  }

  function applyEffects(effects) {
    if (!Array.isArray(effects)) {
      effects = [effects];
    }

    effects.forEach(effect => {
      effect($, commit, getState);
    });
  }

  /**
   * UI 层为 store 注入 action
   * @param {Object} actions UI 相关的 Actions
   */
  function provide(actions) {
    Object.assign(uiRelatedActions, actions);
  }

  return {
    // 负责监听应用状态变化
    subscribe,
    // 触发一个意图
    dispatch,
    // 提交一次状态变更
    commit,
    // 应用副作用逻辑
    applyEffects,
    // 获取当前应用状态
    getState,
    // UI 层为 store 注入 action
    provide,
  };
}
