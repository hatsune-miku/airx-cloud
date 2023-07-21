<template>
    <div ref="container">
        <el-card class="card">
            <el-container class="flex mb-4">
                <el-container>
                    <el-button :disabled="refreshing || working" :icon="Delete" bg text type="danger"
                               @click="handleBulkDelete">
                        Delete
                    </el-button>
                    <el-button :disabled="refreshing || working" :icon="Refresh" bg text type="info"
                               @click="refreshData">
                        Refresh
                    </el-button>
                </el-container>

                <el-pagination
                    v-model:current-page="currentPageNumber"
                    :default-page-size="PageSize"
                    :page-size="PageSize"
                    :total="pageData.totalElements"
                    class="pagination"
                    layout="prev, pager, next"
                />
                <div class="w-4"></div>
                <el-tag size="large">{{ pageData.totalElements }} Shares</el-tag>
            </el-container>

            <el-table
                :data="pageData.content"
                :row-style="RowStyle"
                @selection-change="handleSelectionChange"
                @click.stop
            >
                <!-- Spacer -->
                <el-table-column label="" width="20"/>

                <el-table-column type="selection" width="35"/>

                <el-table-column label="File" prop="file" sortable>
                    <template #default="item">
                        <el-row>
                            <el-col>
                                <span style="font-size: 18px;">{{ item.row.file.name }}</span>
                            </el-col>
                            <el-col>
                                <span style="font-size: 12px;">{{
                                        FileUtils.getSizeDescription(item.row.file.fileStore.size)
                                    }}</span>
                            </el-col>
                        </el-row>
                    </template>
                </el-table-column>

                <el-table-column label="Alias" prop="alias" width="180">
                    <template #default="item">
                        <el-tag
                            @click="handleClickAlias(item.row.alias)"
                            effect="dark"
                            size="large"
                            class="alias-tag"
                        >
                            {{ item.row.alias }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column fixed="right" width="128">
                    <template #default="item">
                        <el-button :disabled="refreshing || working" link size="large" type="primary"
                                   @click="handleDownload(item.$index)">
                            <el-icon>
                                <Download/>
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
        </el-card>
    </div>
</template>

<script lang="tsx" setup>
import {Delete, Download, Refresh} from '@element-plus/icons-vue'
import {onMounted, ref, watch, watchEffect} from 'vue'
import {AirXCloud, FileShare, Page} from "../utils/AirXCloud.ts"
import {Ref} from "vue-demi"
import {UnwrapRef} from "@vue/reactivity"
import FileUtils from "../utils/File"
// @ts-ignore
import {ElMessage, ElMessageBox} from "element-plus"
import {useClipboard} from "@vueuse/core"

const {copy} = useClipboard()

const container = ref(null)
const currentPageNumber = ref(1)
const selectedShares = ref<FileShare[]>([])

const RowHeight = 64
const CardMargin = 16
const tableWidth = ref(0)
const RowStyle = {
    height: RowHeight + 'px',
}

const PageSize = 20

// @ts-ignore
let pageData: Ref<UnwrapRef<Page<FileShare>>> = ref({})
let refreshing = ref(false)
let working = ref(false)

watch(currentPageNumber, () => {
    refreshData()
})

async function handleBulkDelete() {
    working.value = true
    const length = selectedShares.value.length

    try {
        if (length === 0) {
            return
        }
        if (length > 20) {
            ElMessage.warning("You can delete up to 20 shares at a time. Please split it into multiple operations.")
            return
        }

        const confirm = await ElMessageBox.confirm(`Are you sure to stop sharing these ${length} files?`, 'Stop Sharing', {
            confirmButtonText: `Stop Sharing`,
            cancelButtonText: 'Don\'t Stop!',
            confirmButtonClass: 'el-button--danger',
            type: 'warning',
            autofocus: false,
        })
        if (confirm !== 'confirm') {
            return
        }

        for (let share of selectedShares.value) {
            await AirXCloud.deleteShare(share.alias)
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
    pageData.value = await AirXCloud.getMyShares(currentPageNumber.value - 1, PageSize)
    await new Promise(resolve => setTimeout(resolve, 300))
    refreshing.value = false
}

function handleClickAlias(alias: string) {
    copy(AirXCloud.makeShareLink(alias))
    ElMessage.success(`Copied share link to clipboard.`)
}

function handleSelectionChange(shares: FileShare[]) {
    selectedShares.value = shares
}

async function handleDownload(index: number) {
    refreshing.value = true
    const share = pageData.value.content[index]
    await AirXCloud.downloadFile(share.file.name, share.file.id)
    refreshing.value = false
}

async function handleDelete(index: number) {
    refreshing.value = true
    const share = pageData.value.content[index]
    try {
        const confirm = await ElMessageBox.confirm(`Are you sure to stop sharing ${share.file.name}?`, 'Delete', {
            confirmButtonText: 'Stop Sharing',
            cancelButtonText: 'Don\'t Stop!',
            confirmButtonClass: 'el-button--danger',
            autofocus: false,
        })
        if (confirm !== 'confirm') {
            return
        }

        await AirXCloud.deleteShare(share.alias)
        await refreshData()
    } catch (e) {
        console.log(e)
    } finally {
        refreshing.value = false
    }
}

async function mounted() {
    await refreshData()
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

.alias-tag {
    cursor: pointer;
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
</style>
