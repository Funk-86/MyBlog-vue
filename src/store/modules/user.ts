import { TOKEN_NAME } from '@/config/global';
import { login as apiLogin } from '@/service/service-blog';

const USER_INFO_KEY = 'myblog-admin-userinfo';

const InitUserInfo = {
  roles: [],
  id: null,
  username: '',
  email: '',
};

function loadUserInfo() {
  try {
    const s = localStorage.getItem(USER_INFO_KEY);
    return s ? JSON.parse(s) : InitUserInfo;
  } catch {
    return InitUserInfo;
  }
}

const state = {
  token: localStorage.getItem(TOKEN_NAME) || '',
  userInfo: loadUserInfo(),
};

const mutations = {
  setToken(state, token) {
    if (token) {
      localStorage.setItem(TOKEN_NAME, token);
    } else {
      localStorage.removeItem(TOKEN_NAME);
    }
    state.token = token || '';
  },
  removeToken(state) {
    localStorage.removeItem(TOKEN_NAME);
    state.token = '';
  },
  setUserInfo(state, userInfo) {
    state.userInfo = userInfo || InitUserInfo;
    try {
      if (userInfo && userInfo.roles?.length) {
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
      } else {
        localStorage.removeItem(USER_INFO_KEY);
      }
    } catch (e) {
      // ignore
    }
  },
};

const getters = {
  token: (state) => state.token,
  roles: (state) => state.userInfo?.roles || [],
  userInfo: (state) => state.userInfo,
};

const actions = {
  async login({ commit }, { account, password }) {
    const res = await apiLogin(account, password) as { id?: number; role?: number; username?: string; email?: string } | null;
    if (!res || !res.id) {
      throw new Error('账号或密码错误');
    }
    const token = `user_${res.id}`;
    const roles = Number(res.role) === 1 ? ['ALL_ROUTERS'] : ['UserIndex', 'DashboardBase', 'login'];
    const userInfo = {
      id: res.id,
      username: res.username,
      email: res.email,
      roles,
    };
    commit('setToken', token);
    commit('setUserInfo', userInfo);
  },
  async getUserInfo({ commit, state }) {
    if (!state.token || state.userInfo?.roles?.length) return;
    const cached = loadUserInfo();
    if (cached?.roles?.length) {
      commit('setUserInfo', cached);
    }
  },
  async logout({ commit }) {
    commit('removeToken');
    commit('setUserInfo', InitUserInfo);
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
