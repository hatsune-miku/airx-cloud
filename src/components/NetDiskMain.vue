<template>
    <el-container class="main-body">
        <el-aside>
            <div class="header-container">
                <h4 class="header-subtitle flex">
                    AirX Cloud &nbsp;
                    <el-tag>Official Server</el-tag>
                </h4>
                <h2 class="header-title">
                    Hi, <span :class="privileged ? 'user-privileged' : 'user-normal'">{{ userName }}</span>!
                    <span class="function-area">
                        <el-link class="function-item" @click="handleLogout">
                            <el-icon><SwitchButton/></el-icon>
                        </el-link>

                        <!--
                        <el-link class="function-item" @click="useToggleDarkMode()()">
                            <el-icon><Moon/></el-icon>
                        </el-link>
                        -->
                    </span>
                </h2>
                <div v-for="role in roles" :key="role" class="roles">
                    <el-tag :type="role === nounPrivilegedUser ? 'danger' : 'info'" class="role">
                        {{ capitalize(role) }}
                    </el-tag>
                </div>
            </div>

            <el-menu :router="true" class="side-menu" default-active="my-files" @select="handleSelect">
                <el-menu-item index="my-files">
                    <el-icon>
                        <Files/>
                    </el-icon>
                    <span>Transfer Station</span>
                </el-menu-item>


                <el-menu-item index="my-shares">
                    <el-icon>
                        <Share/>
                    </el-icon>
                    <span>My Shares</span>
                </el-menu-item>

            </el-menu>

            <div class="copyright">
                AirX Cloud - {{ isDebug() ? 'Debug' : 'Release' }} Build
            </div>
        </el-aside>

        <el-main>
            <div class="header-div">
                <el-popover v-model:visible="popoverVisible" class="el-popper" placement="bottom"
                            trigger="hover"
                            width="300px">
                    <template #reference>
                        <el-button :class="'task-button ' + taskButtonClass()" type="primary"
                                   @click="handleTaskButtonClick">
                            {{ tasks.length }} Task(s) Running
                        </el-button>
                    </template>

                    <el-table :data="tasks" :show-header="false" class="task-list">
                        <el-table-column>
                            <template #default="scope">
                                <div class="task-name-group">
                                    <div class="task-name">{{ scope.row.name }}</div>
                                </div>
                                <div :class="descriptionTextClass(scope.row)">
                                    {{ scope.row.description }}
                                </div>
                                <el-progress :percentage="scope.row.progress / scope.row.total * 100"
                                             :show-text="false"/>
                                <el-link class="task-cancel-button" @click="handleTaskCancel(scope.row)">
                                    {{ cancelButtonText(scope.row) }}
                                </el-link>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-popover>
            </div>
            <router-view></router-view>
        </el-main>
        <div class="uid">UID: {{ uid }}</div>
    </el-container>
</template>


<script setup>
import {Files, Share, SwitchButton,} from '@element-plus/icons-vue'
import isDebug from "../utils/Debug";
import {ElMessage, ElMessageBox} from "element-plus";
import Net from "../utils/Network"
import {onMounted, onUnmounted, reactive, ref, watch} from "vue";
import {
    useDefaultConfig,
    useDefaultElMessageBoxConfig,
    useInitForDarkMode,
    usePermissionDeniedCounter,
    useTasks,
    useTokenExpiry
} from "../utils/Global";
import {useRouter} from "vue-router";
import {removeLocalStorageAsync, StorageKey} from "../utils/Storage";
import {useLocalStorage} from "@vueuse/core";
import { AirXCloud } from "../utils/AirXCloud";
import {useGlobalState} from "../state/GlobalState";

/**
 * [{
 *  uuid: string,
 *  name: string,
 *  progress: number,
 *  total: number,
 * }]
 */
const tasks = ref([])
const router = useRouter()
const didAppearAnimPlayed = ref(false)
const {getTasks, addTask, removeTask} = useTasks()

const TaskStatusRunning = 0
const TaskStatusSuccess = 1
const TaskStatusFailed = 2

const userName = ref('')
const privileged = useLocalStorage(StorageKey.privileged, false)
const defaultElConfig = useDefaultElMessageBoxConfig()
const defaultConfig = useDefaultConfig()
const uid = useLocalStorage(StorageKey.uid, '0')

const nounPrivilegedUser = 'Superuser'
const intervalHandle = ref(null)
const popoverVisible = ref(false)
const roles = reactive(
    useLocalStorage(StorageKey.roles, 'Guest').value
        .split(',')
        .filter(s => s.length > 0)
)

if (privileged.value) {
    roles.unshift(nounPrivilegedUser)
}

function capitalize(s) {
    s = s.toLowerCase()
    return s.charAt(0).toUpperCase() + s.slice(1)
}

function handleSelect(route) {
    console.log(route)
}

function handleLogout() {
    ElMessageBox.confirm('Are you sure to log out?', 'Log out', {
        confirmButtonText: 'Log out',
        cancelButtonText: 'Cancel',
        type: 'warning',
        ...defaultElConfig,
    }).then(() => {
        removeLocalStorageAsync(StorageKey.token)
        removeLocalStorageAsync(StorageKey.username)
        removeLocalStorageAsync(StorageKey.roles)
        removeLocalStorageAsync(StorageKey.privileged)
        removeLocalStorageAsync(StorageKey.uid)
        removeLocalStorageAsync(StorageKey.session_expires_at)
        router.push('/login')
    }).catch(() => {
    })
}

async function checkToken() {
    let response = await AirXCloud.greetings()
    userName.value = response.name

    localStorage.setItem(StorageKey.username, response.name)
    useGlobalState().uid = response.uid ?? 0
    ElMessage.success(`Hello, ${response.name}!`)

    await router.push('/my-files')
}

function taskButtonClass() {
    if (!didAppearAnimPlayed.value) {
        return 'task-button-animation-hide'
    }
    if (tasks.value.length > 0) {
        return 'task-button-animation-enter'
    } else {
        return 'task-button-animation-exit'
    }
}

function handleTaskButtonClick() {
    popoverVisible.value = !popoverVisible.value
}

async function handleCreateTask() {
    let uuid = (await Net.post('/debug', {
        name: 'test_task'
    })).data
    console.log("Created task: " + uuid)
    addTask(uuid)
    await tickEvent()
}

function mounted() {
    checkToken()
    useInitForDarkMode()()
    intervalHandle.value = setInterval(tickEvent, defaultConfig.taskRefreshRateMillis)

    const tokenExpired = useTokenExpiry()
    watch(tokenExpired, async () => {
        if (!tokenExpired.value) {
            return
        }
        await ElMessageBox.confirm('Your session has expired, please log in again.', 'Session Expired', {
            confirmButtonText: 'Log in',
            cancelButtonText: 'Cancel',
            type: 'info',
            ...defaultElConfig,
        }).catch(() => {
        })

        localStorage.removeItem(StorageKey.token)
        localStorage.removeItem(StorageKey.uid)
        localStorage.removeItem(StorageKey.username)
        await router.push('/login')
    })

    const permissionDeniedCounter = usePermissionDeniedCounter()
    watch(permissionDeniedCounter, () => {
        ElMessageBox.alert('You need the corresponding permission to access this item.', 'Permission Error', {
            confirmButtonText: 'OK',
            type: 'info',
            ...defaultElConfig,
        }).catch(() => {
        })
    })
}

function unmounted() {
    clearInterval(intervalHandle.value)
}

function tickEvent() {
    refreshTasks()
}

async function refreshTasks() {
    let taskUuids = getTasks()

    if (taskUuids.length === 0) {
        return
    }

    let taskList = (await Net.get('/task', {
        uuids: taskUuids.join(',')
    })).data

    if (taskList.length > 0) {
        if (!didAppearAnimPlayed.value) {
            popoverVisible.value = true
        }
        didAppearAnimPlayed.value = true
    }

    tasks.value = taskList.filter(t => !!t)
}

function handleTaskCancel(task) {
    useTasks().removeTask(task.uuid)
    tasks.value = tasks.value.filter(t => t.uuid !== task.uuid)
    Net.delete(`/task/${task.uuid}`)
}

function cancelButtonText(task) {
    switch (task.status) {
        case TaskStatusRunning:
            return 'Cancel'
        case TaskStatusSuccess:
            return 'OK'
        case TaskStatusFailed:
            return 'Dismiss'
    }
}

function descriptionTextClass(task) {
    switch (task.status) {
        case TaskStatusRunning:
            return 'task-description'
        case TaskStatusSuccess:
            return 'task-description-success'
        case TaskStatusFailed:
            return 'task-description-failed'
    }
}

onMounted(mounted)
onUnmounted(unmounted)

</script>


<style lang="scss" scoped>
.main-body {
    height: 100vh;
}

.header-container {
    margin: 24px 24px;
}

.header-title {
    left: 20px;
    font-size: 24px;
    margin-bottom: 4px;
}

.header-subtitle {
    color: gray;
}

li .el-menu-item {
    font-weight: bold;
}

.copyright {
    margin: 24px;
    color: gray;
    text-align: center;
}

.side-menu {
    margin-left: 12px;
    border: 0;
    border-radius: 12px;
}

.dark .side-menu {
    background: rgb(29, 30, 31);
}

.function-area {
    display: inline;
}

.function-item {
    margin: 4px;
    font-size: 22px;
}

.header-div {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.current-location {
    font-family: Monaco, "Courier New", Consolas, Monospaced;
    color: gray;
}

.task-button {
    border-radius: 12px;
}

.task-button-animation-enter {
    transform: scale(1);
    animation: task-button-appear 0.5s;
}

.task-button-animation-exit {
    transform: scale(0);
    animation: task-button-disappear 0.3s;
}

.task-button-animation-hide {
    display: none;
}

@keyframes task-button-appear {
    0% {
        transform: scale(0.2);
    }

    75% {
        transform: scale(1.1);
    }

    100% {
        transform: scale(1);
    }
}

@keyframes task-button-disappear {
    0% {
        transform: scale(1);
    }

    100% {
        transform: scale(0);
    }
}

.task-list {
    border-radius: 12px;
}

.task-item {
    padding: 4px;
    margin: 8px 4px;
}

.task-name {
    font-weight: bold;
    font-size: 12px;
    margin-bottom: 2px;
}

.task-description {
    font-size: 12px;
    margin-bottom: 2px;
}

.task-description-failed {
    font-size: 12px;
    margin-bottom: 2px;
    color: darkred;
}

.task-description-success {
    font-size: 12px;
    margin-bottom: 2px;
    color: green;
}

.task-cancel-button {
    float: right;
    margin-top: 4px;
}

.task-name-group {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.roles {
    display: inline;
}

.role {
    margin: 2px;
}

.user-normal {
}

.user-privileged {
    color: $color-shiny;
}

.el-tag.el-tag--danger {
    --el-tag-bg-color: $color-shiny;
    color: $color-shiny;
}

.el-tag.el-tag--danger.dark {
    --el-tag-bg-color: $color-shiny;
    color: $color-shiny;
}

.uid {
    position: fixed;
    bottom: 16px;
    right: 16px;
    color: $color-dimmed;
    opacity: 0.7;
}
</style>

<style>
.el-popper.is-light {
    border-radius: 12px !important;
}

.el-sub-menu__title {
    border-radius: 12px !important;
}
</style>
