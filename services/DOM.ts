export const setRefreshPos = (y) =>
  (document.getElementById('refresh').style.top = `${y}px`);
export const resetRefresh = () => setRefreshPos(14);
export const setData = (data) =>
  (document.getElementById('data').innerText = data);
