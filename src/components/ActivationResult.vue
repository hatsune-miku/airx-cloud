<template>
    <div
        class="result-background relative flex items-top justify-center min-h-screen bg-gray-100 sm:pt-0"
    >
        <div class="share-card mx-auto sm:px-6 lg:px-8">
            <div class="mt-8 bg-white overflow-hidden shadow sm:rounded-lg p-6">
                <h2 class="text-xl leading-7 font-semibold">AirX Cloud</h2>
                <div v-if="success" class="mt-4 pt-4 text-gray-800 border-t border-dashed">
                    <div class="message-area mb-4">
                            {{ message }}
                    </div>
                    <div class="data-area">
                        <el-row>
                            <el-col :span="12">
                                <el-row>
                                    Your UID
                                </el-row>
                                <el-row>
                                    <span class="uid-span">{{ uid }}</span>
                                </el-row>
                            </el-col>
                            <el-col :span="12" class="operations-area">
                                <el-button type="primary" @click="handleGoLogin">
                                    Go Login
                                </el-button>
                            </el-col>
                        </el-row>
                    </div>
                </div>

                <div v-else class="mt-4 pt-4 text-gray-800 border-t border-dashed">
                    <div class="message-area">
                        {{ message }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import {ref} from "vue-demi";
import {useRouter} from "vue-router";

const router = useRouter()

function getUrlKey(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.href) || [, ""])[1].replace(/\+/g, '%20')) || null
}

function handleGoLogin() {
    router.push('/login')
}

let uid = ref(getUrlKey('uid'))
let message = ref(getUrlKey('message'))
let success = message.value.includes('success')

</script>

<style lang="scss" scoped>
@use "../assets/vars" as vars;

.result-background {
    background-color: vars.$color-primary;
}

.data-area {
    border-radius: 12px;
    padding: 12px;
    background-color: vars.$color-bright;
}

.uid-span {
    color: vars.$color-primary;
    font-size: 36px;
}

.message-area {
    font-size: 24px;
}

.operations-area {
    justify-content: center;
    align-items: center;
    display: flex;
}
</style>
