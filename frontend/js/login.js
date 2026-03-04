document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoading = loginBtn.querySelector('.btn-loading');
    const secretInput = document.getElementById('secret');
    const togglePasswordBtn = document.getElementById('togglePassword');

    const serverUrl = window.location.origin;

    // 检查是否已登录
    checkAuth().then(isAuth => {
        if (isAuth) {
            showToast('已自动登录', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    });

    togglePasswordBtn.addEventListener('click', function() {
        const type = secretInput.getAttribute('type') === 'password' ? 'text' : 'password';
        secretInput.setAttribute('type', type);
        const icon = this.querySelector('i');
        if (type === 'password') {
            icon.className = 'fa fa-eye text-xl';
        } else {
            icon.className = 'fa fa-eye-slash text-xl';
        }
    });

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const secret = secretInput.value.trim();

        if (!secret) {
            showToast('请输入API密钥', 'warning');
            return;
        }

        setLoading(true);

        try {
            const result = await Api.login(secret, serverUrl);

            if (result.success) {
                showToast('登录成功', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                showToast(result.msg || '登录失败', 'error');
            }
        } catch (error) {
            showToast('登录请求失败: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    });

    function setLoading(loading) {
        if (loading) {
            loginBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
        } else {
            loginBtn.disabled = false;
            btnText.style.display = 'flex';
            btnLoading.style.display = 'none';
        }
    }
});

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    
    toast.textContent = message;
    
    // 移除所有类型类
    toast.className = 'fixed top-5 right-5 z-50 px-6 py-4 rounded-xl text-white font-semibold shadow-xl backdrop-blur-lg transform translate-x-full opacity-0 transition-all duration-500 ease-out';
    
    // 添加类型类
    let bgClass = '';
    switch (type) {
        case 'success':
            bgClass = 'bg-gradient-to-r from-green-400 to-emerald-500';
            break;
        case 'error':
            bgClass = 'bg-gradient-to-r from-rose-500 to-red-500';
            break;
        case 'warning':
            bgClass = 'bg-gradient-to-r from-amber-400 to-yellow-500';
            break;
        default:
            bgClass = 'bg-gradient-primary';
    }
    
    toast.classList.add(...bgClass.split(' '));
    
    // 显示toast
    setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    }, 100);
    
    // 3秒后隐藏
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
    }, 3000);
}
