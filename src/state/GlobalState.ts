import {defineStore} from "pinia";

export const useGlobalState = defineStore('global', {
    state: () => ({
        uid: 0,
    }),
})
