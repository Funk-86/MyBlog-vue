export interface msgDataItem {
  id: string;
  content: string;
  type: string;
  status: boolean;
  collected: boolean;
  date: string;
  quality: string;
}
// 定义的state初始值（从后端拉取后填充，这里默认空）
const state: { msgData: Array<msgDataItem> } = {
  msgData: [],
};

const mutations = {
  setMsgData(state, data) {
    // eslint-disable-next-line no-param-reassign
    state.msgData = data;
  },
};

const getters = {
  unreadMsg: (state) => state.msgData.filter((item) => item.status),
  readMsg: (state) => state.msgData.filter((item) => !item.status),
};

const actions = {};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
