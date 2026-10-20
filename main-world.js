// runs code reading logic in main world of leetcode

(function () {
  const REQUEST = 'LEETVISION_GET_CODE';
  const RESPONSE = 'LEETVISION_CODE';

  function readMonacoValue() {
    if (!window.monaco || !window.monaco.editor) return null;

    // getEditors() reflects what is actually on screen; getModels() can include
    // stale models from previously visited problems, so prefer the editor.
    const editors = window.monaco.editor.getEditors?.() || [];
    for (const editor of editors) {
      const value = editor.getValue?.();
      if (value && value.trim()) return value;
    }

    const models = window.monaco.editor.getModels?.() || [];
    for (const model of models) {
      const value = model.getValue?.();
      if (value && value.trim()) return value;
    }

    return null;
  }

  window.addEventListener('message', (event) => {
    // Only answer the content script on this same LeetCode page.
    if (event.source !== window || event.origin !== window.location.origin) return;
    if (!event.data || event.data.type !== REQUEST) return;

    let code = null;
    try {
      code = readMonacoValue();
    } catch (err) {
      code = null;
    }

    window.postMessage({ type: RESPONSE, code: code || '', requestId: event.data.requestId }, window.location.origin);
  });
})();
