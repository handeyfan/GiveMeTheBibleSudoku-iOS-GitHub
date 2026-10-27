/* Makes random puzzles in the background so the screen stays responsive. */
importScripts('sdengine.js');
self.onmessage = function (e) { let r = null; try { r = self.SDEngine.generate(e.data); } catch (err) { r = null; } self.postMessage(r); };
