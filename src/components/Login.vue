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
                <div class="mt-4 pt-4 text-gray-800 border-t border-dashed">
                    <el-form :model="loginForm">
                        <el-form-item style="margin-bottom: 4px">
                            <el-input
                                v-model="loginForm.uid"
                                placeholder="UID / Email"
                                @keydown.enter="handleLogin"
                            ></el-input>
                        </el-form-item>
                        <el-form-item>
                            <el-input
                                v-model="loginForm.password"
                                placeholder="Password"
                                type="password"
                                @keydown.enter="handleLogin"
                            />
                        </el-form-item>
                    </el-form>

                    <el-row class="button-row">
                        <el-button :disabled="loading" class="login-button" type="primary" @click="handleLogin">
                            Sign In
                        </el-button>
                    </el-row>

                    <el-row class="button-row mt-2">
                        <el-button class="register-button" type="text" @click="handleCreateAccount">
                            Create Account
                        </el-button>
                    </el-row>

                    <el-divider>OR</el-divider>

                    <div id="signin-button"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import {onMounted, reactive} from "vue";
import {useRouter} from "vue-router";
import {AirXCloud} from "../utils/AirXCloud";
import {ElMessage} from "element-plus";
import {ref} from "vue-demi";

const router = useRouter()
const loading = ref(false)

const loginForm = reactive({
    uid: "",
    password: "",
});

async function handleLogin() {
    if (loading.value) {
        return
    }

    loading.value = true

    try {
        if (loginForm.uid === "" || loginForm.password === "") {
            ElMessage.error("UID or Password cannot be empty!")
            return
        }

        const response = await AirXCloud.signIn(loginForm.uid, loginForm.password)
        if (response.success) {
            ElMessage.success("Login Success!")
            await router.push("/")
        } else {
            ElMessage.error(`Login Failed: ${response.message}`)
        }
    } catch (e) {
        ElMessage.error(`Login Failed: ${e}`)
    } finally {
        setTimeout(() => {
            loading.value = false
        }, 1000)
    }
}

function handleCreateAccount() {
    router.push("/sign-up")
}

function onLoginResponse(response) {
    console.log(response);
    handleLogin();
}

onMounted(() => {
    google.accounts.id.initialize({
        client_id:
            "276924621209-jjmd93575jg7rquclru92prqvts7njt2.apps.googleusercontent.com",
        callback: onLoginResponse,
    })
    google.accounts.id.renderButton(document.getElementById("signin-button"), {
        theme: "outline",
        size: "large",
    })
    google.accounts.id.prompt()
})

</script>


<style lang="scss" scoped>
@use '../assets/vars' as vars;

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

