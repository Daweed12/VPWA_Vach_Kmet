import { boot } from 'quasar/wrappers';
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3333', // funguje ti /channels, takže toto je OK
});

export default boot(({ app }) => {
  app.config.globalProperties.$api = api;
});
