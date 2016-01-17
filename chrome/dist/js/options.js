'use strict';

function save_options() {
  var token = document.getElementById('token').value;
  var apiSite = document.getElementById('apiSite').value;
  var status = document.getElementById('status');

  chrome.storage.local.set({ token: token, apiSite: apiSite }, function () {
    status.textContent = 'Options saved.';
    setTimeout(function () {
      status.textContent = '';
    }, 1000);
  });
}

function restore_options() {
  chrome.storage.local.get({ token: '', apiSite: '' }, function (obj) {
    document.getElementById('token').value = obj.token;
    document.getElementById('apiSite').value = obj.apiSite;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);