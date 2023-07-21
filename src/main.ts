import {createApp} from "vue"
import {createRouter, createWebHistory} from "vue-router"

/// Tailwind conflicts with Element Plus!
/// Must import tailwind first, then element plus
import "./assets/tailwind.scss"

import "element-plus/theme-chalk/src/index.scss"
import ElementPlus from "element-plus"

import "./assets/global.scss"

import Login from "./components/Login.vue"
import NetDiskMain from "./components/NetDiskMain.vue"
import MyFiles from "./components/MyFiles.vue"
import MyShares from "./components/MyShares.vue"
import Share from "./components/Share.vue"
import SignUp from "./components/SignUp.vue"
import TermOfService from "./components/TermOfService.vue"
import ActivationResult from "./components/ActivationResult.vue";

import App from "./App.vue"
import Net from "./utils/Network.js";
import {createPinia} from "pinia";

const router = createRouter({
    history: createWebHistory('/'),
    routes: [
        {
            path: "/",
            component: NetDiskMain,
            children: [
                {path: "/my-files", component: MyFiles},
                {path: "/my-shares", component: MyShares},
            ],
        },
        {path: "/share/:shareId", component: Share},
        {path: "/login", component: Login},
        {path: "/sign-up", component: SignUp},
        {path: "/term-of-service", component: TermOfService},
        {path: "/activation-result", component: ActivationResult},
    ],
})

const pinia = createPinia()

Net.init()

createApp(App)
    .use(router)
    .use(pinia)
    .use(ElementPlus)
    .mount("#app")
