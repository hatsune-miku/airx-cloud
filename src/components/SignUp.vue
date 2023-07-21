<template>
    <div
        class="area login-body relative flex items-top justify-center min-h-screen bg-gray-100 sm:items-center sm:pt-0"
    >
        <ul class="circles">
            <li v-for="_ in 10"/>
        </ul>

        <div class="max-w-4xl mx-auto sm:px-6 lg:px-8">
            <div class="mt-8 bg-white overflow-hidden shadow sm:rounded-lg p-6">
                <h2 class="text-2xl leading-7 font-semibold">AirX Cloud</h2>

                <div v-if="showCheckYourEmail" class="mt-4 pt-4 text-gray-800 border-t border-dashed">
                    <el-row>
                        Account created successfully!
                    </el-row>
                    <el-row>
                        Please check your email to activate your account.
                    </el-row>
                </div>

                <div v-else class="mt-4 pt-4 text-gray-800 border-t border-dashed">
                    <el-form
                        :model="signUpForm"
                        :rules="rules"
                        label-position="right"
                        label-width="100"
                        ref="formRef"
                        status-icon
                    >
                        <el-form-item class="form-item" label="Email" prop="email" required>
                            <el-input
                                v-model="signUpForm.email"
                                placeholder="Email"
                            />
                        </el-form-item>
                        <el-form-item class="form-item" label="Nickname" prop="nickname" required>
                            <el-input
                                v-model="signUpForm.nickname"
                                placeholder="Nickname"
                            />
                        </el-form-item>
                        <el-form-item class="form-item" label="Password" prop="password" required>
                            <el-input
                                v-model="signUpForm.password"
                                placeholder="Password"
                            />
                        </el-form-item>
                    </el-form>

                    <el-row class="button-row">
                        <el-checkbox v-model="agreed">
                            Agree to the
                            <el-link href="term-of-service" target="_blank" underline>
                                Terms of Service
                            </el-link>
                        </el-checkbox>
                    </el-row>

                    <el-row class="button-row">
                        <el-button class="login-button" type="primary" @click="handleCreateAccount">
                            Create Account
                        </el-button>
                    </el-row>
                </div>
            </div>
        </div>
    </div>
</template>


<script lang="ts" setup>
import {onMounted, reactive, ref} from "vue"
// @ts-ignore
import type {FormInstance, FormRules} from 'element-plus'
import Hash from "../utils/Hash"
import {AirXCloud} from "../utils/AirXCloud.ts"
// @ts-ignore
import {ElMessageBox} from "element-plus"

const formRef = ref<FormInstance>()
let agreed = ref(false)
let showCheckYourEmail = ref(false)

interface SignUpForm {
    email: string,
    password: string,
    nickname: string,
}

const signUpForm = reactive<SignUpForm>({
    email: "",
    password: "",
    nickname: "",
});

const rules = reactive<FormRules<typeof signUpForm>>({
    email: [
        {
            pattern: /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
            message: 'Incorrect email format',
            trigger: 'blur'
        },
    ]
})

async function handleCreateAccount() {
    await formRef.value!.validate(async (valid) => {
        if (!valid || !agreed.value) {
            return
        }

        const form: SignUpForm = {
            email: signUpForm.email,
            password: Hash.sha256(signUpForm.password),
            nickname: signUpForm.nickname,
        }
        const response = await AirXCloud.signUp(form)
        if (!response.success) {
            await ElMessageBox({
                title: 'Error',
                message: response.message,
                type: 'error',
            })
            return
        }

        showCheckYourEmail.value = true
    })
}

onMounted(() => {
})

</script>

<style lang="scss" scoped>
@use '../assets/vars' as vars;

.form-item {
}

.button-row {
    justify-content: center;
}

.login-button {
    width: 100%;
}

.register-button {
    width: 100%;
}

@import url('https://fonts.googleapis.com/css?family=Exo:400,700');

login-body {
    font-family: 'Exo', sans-serif;
}

.context {
    width: 100%;
    position: absolute;
    top: 50vh;
}

.area {
    background: vars.$color-primary;
    background: linear-gradient(vars.$color-primary, vars.$color-primary-dimmed);
    width: 100%;
    height: 100vh;
}

.circles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.circles li {
    position: absolute;
    display: block;
    list-style: none;
    width: 20px;
    height: 20px;
    background: rgba(255, 255, 255, 0.2);
    animation: animate 25s linear infinite;
    bottom: -150px;
}

.circles li:nth-child(1) {
    left: 25%;
    width: 80px;
    height: 80px;
    animation-delay: 0s;
}


.circles li:nth-child(2) {
    left: 10%;
    width: 140px;
    height: 140px;
    animation-delay: 2s;
    animation-duration: 12s;
}

.circles li:nth-child(3) {
    left: 70%;
    width: 20px;
    height: 20px;
    animation-delay: 4s;
}

.circles li:nth-child(4) {
    left: 40%;
    width: 60px;
    height: 60px;
    animation-delay: 0s;
    animation-duration: 18s;
}

.circles li:nth-child(5) {
    left: 65%;
    width: 20px;
    height: 20px;
    animation-delay: 0s;
}

.circles li:nth-child(6) {
    left: 75%;
    width: 110px;
    height: 110px;
    animation-delay: 3s;
}

.circles li:nth-child(7) {
    left: 35%;
    width: 150px;
    height: 150px;
    animation-delay: 7s;
}

.circles li:nth-child(8) {
    left: 50%;
    width: 25px;
    height: 25px;
    animation-delay: 15s;
    animation-duration: 45s;
}

.circles li:nth-child(9) {
    left: 20%;
    width: 15px;
    height: 15px;
    animation-delay: 2s;
    animation-duration: 35s;
}

.circles li:nth-child(10) {
    left: 85%;
    width: 150px;
    height: 150px;
    animation-delay: 0s;
    animation-duration: 11s;
}


@keyframes animate {
    0% {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
        border-radius: 10%;
    }

    100% {
        transform: translateY(-1000px) rotate(720deg);
        opacity: 0;
        border-radius: 50%;
    }
}

.login-body {
    animation: animatedBackground 20s linear infinite;
}
</style>
