/* ================================================================
   TabFlow — shared drag state
   One drag happens at a time; feature modules read/write it here so
   the open-tabs panel and the collections grid can interoperate.

   drag payloads:
     { type: 'card',       tabId, collectionId }
     { type: 'collection', collectionId, spaceId }
     { type: 'open-tab',   title, url, favicon }
   ================================================================ */

let current = null;

export function setDrag(payload) {
  current = payload;
}

export function getDrag() {
  return current;
}

export function clearDrag() {
  current = null;
}
