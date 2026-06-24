/**
 * 登录/注册页交互脚本（原型模式）
 * - 登录与注册模式切换
 * - 基础表单校验（邮箱、密码、确认密码）
 * - 密码显示/隐藏切换
 * - 演示登录/注册：验证通过后写入会话并跳转概览页
 * - 生产环境应替换为后端 /api/login 与 /api/register 鉴权
 */
(function () {
  'use strict';

  var form = document.getElementById('loginForm');
  var emailInput = document.getElementById('loginEmail');
  var passwordInput = document.getElementById('loginPassword');
  var confirmInput = document.getElementById('loginPasswordConfirm');
  var confirmField = document.getElementById('confirmPasswordField');
  var confirmHint = document.getElementById('passwordConfirmHint');
  var submitBtn = document.getElementById('loginSubmit');
  var submitLabel = document.getElementById('submitLabel');
  var submitIcon = submitBtn ? submitBtn.querySelector('.btn__icon') : null;
  var emailHint = document.getElementById('emailHint');
  var passwordHint = document.getElementById('passwordHint');
  var loginTitle = document.getElementById('loginTitle');
  var loginLead = document.getElementById('loginLead');
  var formNote = document.getElementById('formNote');
  var formAlert = document.getElementById('formAlert');
  var loginOptions = document.getElementById('loginOptions');
  var loginSwitchText = document.getElementById('loginSwitchText');
  var loginSwitchAction = document.getElementById('loginSwitchAction');
  var forgotPasswordBtn = document.getElementById('forgotPassword');
  var togglePasswordBtn = document.getElementById('togglePassword');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.login-mode-tab'));

  var mode = 'login'; // 'login' | 'register'
  var draftValues = {
    login: { email: '', password: '' },
    register: { email: '', password: '', passwordConfirm: '' }
  };

  var copy = {
    login: {
      title: '欢迎回来',
      lead: '请使用企业账号登录，每个账户的数据独立存储、互不交叉。',
      submit: '登录',
      note: '原型环境下输入任意邮箱与 6 位以上密码即可登录。',
      switchText: '还没有账号？',
      switchAction: '立即注册'
    },
    register: {
      title: '创建账号',
      lead: '注册后你的脱敏映射表与文件将存储在独立会话空间中。',
      submit: '注册',
      note: '原型环境下输入任意邮箱与 6 位以上密码即可完成注册。',
      switchText: '已有账号？',
      switchAction: '直接登录'
    }
  };

  function setAlert(message) {
    if (!formAlert) return;
    formAlert.textContent = message || '';
    formAlert.classList.toggle('is-visible', !!message);
  }

  function setMode(next) {
    if (next !== 'login' && next !== 'register') return;

    // 保存当前模式已输入的值
    draftValues[mode].email = emailInput.value;
    draftValues[mode].password = passwordInput.value;
    if (mode === 'register') draftValues.register.passwordConfirm = confirmInput.value;

    mode = next;

    // 切换标签状态
    tabs.forEach(function (tab) {
      var active = tab.dataset.mode === mode;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.setAttribute('tabindex', active ? '0' : '-1');
    });

    // 更新文案（textContent，避免 innerHTML）
    var c = copy[mode];
    loginTitle.textContent = c.title;
    loginLead.textContent = c.lead;
    submitLabel.textContent = c.submit;
    formNote.textContent = c.note;
    loginSwitchText.textContent = c.switchText;
    loginSwitchAction.textContent = c.switchAction;
    loginSwitchAction.setAttribute('data-switch', mode === 'login' ? 'register' : 'login');

    confirmField.hidden = mode !== 'register';
    loginOptions.hidden = mode !== 'login';

    // 恢复目标模式的草稿值
    emailInput.value = draftValues[mode].email;
    passwordInput.value = draftValues[mode].password;
    confirmInput.value = mode === 'register' ? draftValues.register.passwordConfirm : '';

    // 同步密码框 autocomplete 与 type
    passwordInput.setAttribute('autocomplete', mode === 'register' ? 'new-password' : 'current-password');
    confirmInput.setAttribute('autocomplete', 'new-password');

    clearAllErrors();
    setAlert('');

    // 焦点移动到当前激活标签，提升键盘可达性
    var activeTab = tabs.find(function (t) { return t.dataset.mode === mode; });
    if (activeTab) activeTab.focus();
  }

  function setError(input, hint, message) {
    input.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');
    hint.textContent = message;
    hint.classList.add('is-error');
  }

  function clearError(input, hint, defaultText) {
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    hint.textContent = defaultText;
    hint.classList.remove('is-error');
  }

  function clearAllErrors() {
    clearError(emailInput, emailHint, '示例：investor@fund.com');
    clearError(passwordInput, passwordHint, '密码至少 6 位');
    clearError(confirmInput, confirmHint, '请再次输入密码');
    setAlert('');
  }

  function validateEmail() {
    var value = emailInput.value.trim();
    if (!value) {
      setError(emailInput, emailHint, '请输入企业邮箱');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError(emailInput, emailHint, '邮箱格式不正确');
      return false;
    }
    clearError(emailInput, emailHint, '示例：investor@fund.com');
    return true;
  }

  function validatePassword() {
    var value = passwordInput.value;
    if (!value) {
      setError(passwordInput, passwordHint, '请输入密码');
      return false;
    }
    if (value.length < 6) {
      setError(passwordInput, passwordHint, '密码至少 6 位');
      return false;
    }
    clearError(passwordInput, passwordHint, '密码至少 6 位');
    return true;
  }

  function validateConfirmPassword() {
    if (mode !== 'register') return true;
    var value = confirmInput.value;
    if (!value) {
      setError(confirmInput, confirmHint, '请确认密码');
      return false;
    }
    if (value !== passwordInput.value) {
      setError(confirmInput, confirmHint, '两次输入的密码不一致');
      return false;
    }
    clearError(confirmInput, confirmHint, '请再次输入密码');
    return true;
  }

  function validateAll() {
    return validateEmail() && validatePassword() && validateConfirmPassword();
  }

  // 输入时自动清除已标红的错误
  emailInput.addEventListener('input', function () {
    if (emailInput.classList.contains('is-invalid')) validateEmail();
  });
  passwordInput.addEventListener('input', function () {
    if (passwordInput.classList.contains('is-invalid')) validatePassword();
    if (mode === 'register' && confirmInput.classList.contains('is-invalid')) validateConfirmPassword();
  });
  if (confirmInput) {
    confirmInput.addEventListener('input', function () {
      if (confirmInput.classList.contains('is-invalid')) validateConfirmPassword();
    });
  }

  // 标签切换
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      setMode(tab.dataset.mode);
    });
    tab.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var nextMode = mode === 'login' ? 'register' : 'login';
      setMode(nextMode);
    });
  });

  // 底部文案切换链接
  loginSwitchAction.addEventListener('click', function () {
    setMode(loginSwitchAction.dataset.switch);
  });

  // 忘记密码提示（原型环境）
  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', function () {
      setAlert('原型环境暂不支持重置密码，请直接登录或注册新账号。');
      if (emailInput) emailInput.focus();
    });
  }

  // 密码显隐切换
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', function () {
      var isHidden = passwordInput.type === 'password';
      passwordInput.type = isHidden ? 'text' : 'password';
      togglePasswordBtn.setAttribute('aria-pressed', String(isHidden));
      togglePasswordBtn.setAttribute('aria-label', isHidden ? '隐藏密码' : '显示密码');
      togglePasswordBtn.classList.toggle('is-revealed', isHidden);
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearAllErrors();

    if (!validateAll()) {
      setAlert('请检查表单中的错误项。');
      return;
    }

    var originalLabel = submitLabel.textContent;
    var loadingText = mode === 'register' ? '注册中…' : '登录中…';

    submitBtn.disabled = true;
    submitLabel.textContent = loadingText;
    if (submitIcon) submitIcon.style.display = 'none';

    // 原型：模拟后端鉴权/注册延迟
    setTimeout(function () {
      try {
        var user = {
          email: emailInput.value.trim(),
          loggedInAt: new Date().toISOString(),
          registered: mode === 'register'
        };
        sessionStorage.setItem('desens_user_session', JSON.stringify(user));
      } catch (_) {}

      window.location.href = 'index.html';
    }, 800);
  });
})();
