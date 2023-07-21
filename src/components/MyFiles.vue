<template>
    <div ref="container">
        <el-card class="card">
            <el-container class="flex mb-4">
                <el-container>
                    <el-button :disabled="refreshing || working" :icon="Plus" bg text type="primary"
                               @click="handleUpload">
                        Upload
                    </el-button>
                    <el-button :disabled="refreshing || working" :icon="Delete" bg text type="danger"
                               @click="handleBulkDelete">
                        Delete
                    </el-button>
                    <el-button :disabled="refreshing || working" :icon="Refresh" bg text type="info"
                               @click="refreshData">
                        Refresh
                    </el-button>
                    <el-input
                        v-model="searchTerm"
                        class="search-box ml-3"
                        clearable
                        placeholder="Search Files"
                        @keydown.enter.native="refreshData"
                    >
                        <template #prefix>
                            <el-icon>
                                <Search/>
                            </el-icon>
                        </template>
                    </el-input>
                </el-container>

                <el-pagination
                    v-model:current-page="currentPageNumber"
                    :page-size="PageSize"
                    :default-page-size="PageSize"
                    :total="pageData.totalElements"
                    class="pagination"
                    layout="prev, pager, next"
                />
                <div class="w-4"></div>
                <el-tag size="large">{{ pageData.totalElements }} Files</el-tag>
            </el-container>

            <el-upload
                id="upload"
                ref="uploadInstance"
                :action="uploadAction"
                :file-list="uploadFileList"
                :headers="uploadHeaders"
                :on-success="refreshData"
                auto-upload
                class="upload-box"
                drag
                multiple
            >
                <el-table
                    :data="pageData.content"
                    :row-style="RowStyle"
                    @selection-change="handleSelectionChange"
                    @click.stop
                >
                    <!-- Spacer -->
                    <el-table-column label="" width="20"/>

                    <el-table-column type="selection" width="35"/>

                    <el-table-column label="File" prop="name" sortable>
                        <template #default="item">
                            <el-row>
                                <el-col>
                                    <span style="font-size: 18px;">{{ item.row.name }}</span>
                                    <el-tag v-if="item.row.user.uid !== selfUid" class="ml-2">
                                        <el-tooltip :content="`This file is from ${item.row.user.name}`">
                                            <el-icon>
                                                <Share/>
                                            </el-icon>
                                        </el-tooltip>
                                    </el-tag>
                                </el-col>
                                <el-col>
                                <span style="font-size: 12px;">{{
                                        FileUtils.getSizeDescription(item.row.fileStore.size)
                                    }}</span>
                                </el-col>
                            </el-row>
                        </template>
                    </el-table-column>

                    <el-table-column label="Upload Date" prop="date" sortable width="200">
                        <template #default="item">
                            <el-row>
                                <el-col>
                                <span style="font-size: 14px;">{{
                                        getDayDifferenceDescription(item.row.fileStore.uploadedAt)
                                    }}</span>
                                </el-col>
                                <el-col>
                                <span style="font-size: 10px;">{{
                                        dateFromIsoDate(item.row.fileStore.uploadedAt)
                                    }}</span>
                                </el-col>
                            </el-row>
                        </template>
                    </el-table-column>

                    <el-table-column fixed="right" width="156">
                        <template #default="item">
                            <el-button link size="large" type="primary" @click="handleShare(item.$index)">
                                <el-icon>
                                    <Share/>
                                </el-icon>
                            </el-button>

                            <el-divider direction="vertical"/>

                            <el-button :disabled="refreshing || working" link size="large" type="primary"
                                       @click="handleDownload(item.$index)">
                                <el-icon>
                                    <Download/>
                                </el-icon>
                            </el-button>

                            <el-button :disabled="refreshing || working" link size="large" type="primary"
                                       @click="handleRename(item.$index)">
                                <el-icon>
                                    <Edit/>
                                </el-icon>
                            </el-button>

                            <el-button :disabled="refreshing || working" link size="large" type="info"
                                       @click="handleDelete(item.$index)">
                                <el-icon>
                                    <Delete/>
                                </el-icon>
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-upload>
        </el-card>
    </div>
</template>

<script lang="tsx" setup>
// @ts-nocheck

import {Delete, Download, Edit, Plus, Refresh, Search, Share} from '@element-plus/icons-vue'
import {h, onMounted, ref, watch, watchEffect} from 'vue'
import {format} from 'date-fns'
import _ from 'lodash'
import {AirXCloud, File, Page} from "../utils/AirXCloud.ts"
import {Ref} from "vue-demi"
import {UnwrapRef} from "@vue/reactivity"
import FileUtils from "../utils/File"
import {ElMessage, ElMessageBox, UploadInstance} from "element-plus"
import {useClipboard, useLocalStorage} from "@vueuse/core"
import {StorageKey} from "../utils/Storage"

const container = ref(null)
const currentPageNumber = ref(1)
const selectedFiles = ref([])
const uploadInstance = ref<UploadInstance>()

const RowHeight = 64
const CardMargin = 16
const tableWidth = ref(0)
const RowStyle = {
    height: RowHeight + 'px',
}
const uploadHeaders = {
    Authorization: `Bearer ${localStorage.getItem(StorageKey.token)}`
}
const uploadAction = AirXCloud.getUploadUrl()

const selfUid = useLocalStorage(StorageKey.uid, 0)

const PageSize = 20
let searchTerm = ref("")
let uploadFileList = ref([])

let pageData: Ref<UnwrapRef<Page<File>>> = ref({})
let refreshing = ref(false)
let working = ref(false)

watch(currentPageNumber, () => {
    refreshData()
})

async function handleUpload() {
    // https://blog.csdn.net/xuehongnizhao/article/details/128002618
    uploadInstance.value!.$refs.uploadRef.$refs.inputRef.click()
}

async function handleBulkDelete() {
    working.value = true
    const length = selectedFiles.value.length
    try {
        if (length === 0) {
            return
        }
        if (length > 20) {
            ElMessage.warning("You can delete up to 20 files at a time. Please split it into multiple operations.")
            return
        }

        const confirm = await ElMessageBox.confirm(`Are you sure to delete these ${length} files?`, 'Delete', {
            confirmButtonText: `Delete All ${length} Files!`,
            cancelButtonText: 'Don\'t Delete',
            confirmButtonClass: 'el-button--danger',
            type: 'warning',
            autofocus: false,
        })
        if (confirm !== 'confirm') {
            return
        }

        for (let file: any of selectedFiles.value) {
            await AirXCloud.deleteFile(file.id)
            await refreshData()
        }
    } catch (e) {
        console.log(e)
    } finally {
        working.value = false
    }
}

async function refreshData() {
    refreshing.value = true
    pageData.value = await AirXCloud.getMyFiles(currentPageNumber.value - 1, PageSize, searchTerm.value)
    await new Promise(resolve => setTimeout(resolve, 300))
    refreshing.value = false
}

function handleSelectionChange(files: any[]) {
    selectedFiles.value = files
}

async function handleShare(index: number) {
    const { copy } = useClipboard()

    refreshing.value = true
    const file = pageData.value.content[index]
    try {
        const response = await AirXCloud.createShare(file.id)
        if (!response.success) {
            await ElMessageBox({
                type: 'error',
                title: 'Share Failed',
                message: response.message,
                draggable: true,
                closeOnClickModal: false,
            })
            return
        }

        await copy(AirXCloud.makeShareLink(response.shareId!))
        await ElMessageBox({
            type: 'success',
            title: 'Share Success',
            message: 'The share link has been copied to your clipboard.',
            draggable: true,
            closeOnClickModal: false,
        })
    }
    catch (e) {
        console.log(e)
    }
    finally {
        refreshing.value = false
    }
}

async function handleDownload(index: number) {
    refreshing.value = true
    const file = pageData.value.content[index]
    try {
        await AirXCloud.downloadFile(file.name, file.id)
    }
    catch (e) {
        console.log(e)
    }
    finally {
        refreshing.value = false
    }
}

async function handleDelete(index: number) {
    refreshing.value = true
    const file = pageData.value.content[index]
    try {
        const confirm = await ElMessageBox.confirm(`Are you sure to delete ${file.name}?`, 'Delete', {
            confirmButtonText: 'Delete!',
            cancelButtonText: 'Don\'t Delete',
            confirmButtonClass: 'el-button--danger',
            autofocus: false,
        })
        if (confirm !== 'confirm') {
            return
        }

        const response = await AirXCloud.deleteFile(file.id)
        if (!response.success) {
            await ElMessageBox({
                type: 'error',
                title: 'Delete Failed',
                message: response.message,
                draggable: true,
                closeOnClickModal: false,
            })
            return
        }

        await refreshData()
    } catch (e) {
        console.log(e)
    } finally {
        refreshing.value = false
    }
}

async function handleRename(index: number) {
    refreshing.value = true
    const file = pageData.value.content[index]
    try {
        const name = await ElMessageBox.prompt('Please enter the new name', 'Rename', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            inputPattern: /\S+/,
            inputErrorMessage: 'Name cannot be empty',
            inputValue: file.name,
            draggable: true,
        })

        if (name.action !== 'confirm') {
            return
        }

        if (!FileUtils.isFilenameValid(name.value)) {
            await ElMessageBox({
                type: 'error',
                title: 'Invalid File Name',
                message: h('div', [
                    'We can not use "',
                    h('span', {style: 'color: var(--el-color-primary);'}, name.value),
                    '" because it does not meet the following requirements:',
                    h('ul', {className: 'ml-4 mt-2'}, [
                        h('li', ["1. Can't use ", h('span', {style: 'color: var(--el-color-primary); font-family: menlo, monaco, consolas, serif;'}, '\\ / : * ? \" > < |')]),
                        h('li', "2. Can't start with dot (.)"),
                        h('li', "3. Is not OS reserved file names."),
                    ]),
                ]),
                draggable: true,
                closeOnClickModal: false,
            })
            return
        }
        const response = await AirXCloud.renameFile(file.id, name.value)

        if (response.success) {
            await refreshData()
            return
        }

        ElMessage.error(response.message)
    } catch (e) {
        console.log(e)
    } finally {
        refreshing.value = false
    }
}

async function mounted() {
    await refreshData()
}

function dateFromIsoDate(isoDate: string): string {
    const date = new Date(Date.parse(isoDate))
    return format(date, 'yyyy/MM/dd HH:mm:ss')
}

function getDayDifferenceDescription(date: string) {
    const unix = Date.parse(date) / 1000
    const now = _.now() / 1000
    const diff = now - unix

    if (diff < 0) return 'In The Future'
    if (diff < 10) return 'Just now'
    if (diff < 60) return Math.floor(diff) + ' seconds ago'
    if (diff < 3600) return Math.floor(diff / 60) + ' minutes ago'
    if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago'
    if (diff < 86400 * 2) return 'Yesterday'
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + ' days ago'
    if (diff < 86400 * 30) return Math.floor(diff / (86400 * 7)) + ' weeks ago'
    if (diff < 86400 * 365) return Math.floor(diff / (86400 * 30)) + ' months ago'
    if (diff < 86400 * 365 * 10) return Math.floor(diff / (86400 * 365)) + ' years ago'
}

/// Set the table width to the container width
watchEffect(() => {
    if (container.value) {
        tableWidth.value = container.value['offsetWidth'] - 2 * CardMargin
    }
})

onMounted(mounted)

</script>

<style lang="scss" scoped>
.pagination {
    border-radius: var(--el-border-radius-base);
    background: var(--el-fill-color-light);
}

.search-box {
    width: 150px;
}
</style>

<style lang="scss">
.el-pager {
    background: transparent !important;
}

.pagination {
    button, li {
        background: transparent !important;
        border: none !important;
    }
}

.el-upload-dragger {
    padding: 0;
    border: none;
    cursor: default;
}

</style>
