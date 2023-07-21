<template>
    <div
        class="share-background relative flex items-top justify-center min-h-screen bg-gray-100 sm:items-center sm:pt-0"
    >
        <div class="share-card mx-auto sm:px-6 lg:px-8">
            <div class="mt-8 bg-white overflow-hidden shadow sm:rounded-lg p-6">
                <h2 class="text-xl leading-7 font-semibold">AirX Cloud</h2>

                <div v-if="deleted" class="mt-4 pt-4 text-gray-800 border-t border-dashed">
                    <div class="description mb-4">
                        The file has been deleted by the owner.
                    </div>
                    <el-tag
                        :disabled="loading" class="download-button" size="large" effect="light"
                    >
                        <span v-if="isMacOs">&#8984;W</span>
                        <span v-else>Ctrl + W</span>
                    </el-tag>
                </div>
                <div v-else-if="!file" class="mt-4 pt-4 text-gray-800 border-t border-dashed">
                    Loading...
                </div>
                <div v-else class="mt-4 pt-4 text-gray-800 border-t border-dashed">
                    <el-row>
                        <el-col>
                            <div class="title">
                                {{ file.name }}
                            </div>
                        </el-col>
                        <el-col>
                            <div class="subtitle">
                                {{ FileUtils.getSizeDescription(file.fileStore.size) }}
                            </div>
                        </el-col>
                        <el-col style="height: 35px"/>
                        <el-col>
                            <div class="description text-gray-400 mb-4">
                                File from {{ file.user.name }} (UID: {{ file.user.uid }})
                            </div>
                        </el-col>
                    </el-row>


                    <el-row>
                        <el-button
                            :disabled="loading" class="download-button" size="large" type="primary"
                            @click="handleDownload"
                        >
                            <el-icon>
                                <Download/>
                            </el-icon>
                            Download
                        </el-button>
                    </el-row>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="tsx" setup>
import {useRoute} from "vue-router";
import {AirXCloud, File as AirXFile, QueryShareResponse} from "../utils/AirXCloud";
import {onMounted} from "vue";
import {ref} from "vue-demi";
import FileUtils from "../utils/File.ts";
import {Download} from "@element-plus/icons-vue";

// @ts-ignore
import {ElMessageBox} from "element-plus";

const route = useRoute()
const alias = route.params.shareId

let file = ref<AirXFile>()
let downloaded = ref(false)
let loading = ref(false)
let deleted = ref(false)

// @ts-ignore
let isMacOs = (navigator.platform || navigator.userAgent).toLowerCase().includes('mac')

async function handleDownload() {
    loading.value = true
    try {
        if (downloaded.value) {
            const response = await ElMessageBox.confirm('You have already downloaded this file. Do you want to download it again?', 'Download', {
                confirmButtonText: 'Download Again',
                cancelButtonText: 'Cancel',
                type: 'info'
            })
            if (response !== 'confirm') {
                return
            }
        }

        await AirXCloud.downloadFile(file.value!.name, file.value!.id)
        downloaded.value = true
    } catch (e) {
    } finally {
        loading.value = false
    }
}

async function mounted() {
    // @ts-ignore
    const response: QueryShareResponse = await AirXCloud.querySingleShare(alias)

    if (!response.file) {
        deleted.value = true
        return
    }

    file.value = response.file!
}

onMounted(mounted)

</script>

<style lang="scss" scoped>
@use "../assets/vars" as vars;

.share-background {
    background-color: vars.$color-primary;
}

.share-card {
    width: 450px;
}

.download-button {
    width: 100%;
    font-size: 18px;
    font-weight: bold;
}

.title {
    font-size: 24px;
}

.subtitle {
    font-size: 18px;
}

.description {
    font-size: 16px;
}
</style>
