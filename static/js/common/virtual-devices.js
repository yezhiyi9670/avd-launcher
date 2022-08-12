const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

(() => {
	let VirtualDevice = function(data) {
		for(let key in data) {
			this[key] = data[key];
		}

		/**
		 * PID 文件路径
		 */
		this.pidPath = path.join(this.path, 'hardware-qemu.ini.lock/pid');
		/**
		 * 描述文字
		 */
		this.getDescriptor = function() {
			return `Android ${this.androidVer} ${this.abi} / ${this.systemType}`;
		};
		/**
		 * 是否正在运行
		 * @return 0 若不在运行，-1 若无法获取，否则 pid
		 */
		this.isRunning = function() {
			if(!fs.existsSync(this.pidPath)) {
				return 0;
			}
			try {
				// 由于进程占用问题，必须手动以只读方式打开读取。
				let file = fs.openSync(this.pidPath, 'r');
				let buffer = new Buffer.alloc(1024);
				let len = fs.readSync(file, buffer, 0, 1024);
				fs.closeSync(file);
				return +buffer.slice(0, len).toString().trim();
			} catch(err) {
				return -1;
			}
		};
		/**
		 * 强行停止
		 * @return -1 若不在运行，1 若成功停止，否则 0
		 */
		this.forceStop_async = async function() {
			let pid = this.isRunning();
			if(pid == 0) {
				return -1;
			}
			if(pid == -1) {
				return 0;
			}
			let code = await new Promise((resolve, reject) => {
				child_process.exec(`taskkill /f /pid "${pid}"`, (code) => {
					resolve(code);
				});
			});
			if(!code || code == 128) {
				await new Promise((resolve, reject) => {
					setTimeout(() => {
						try {
							fs.unlinkSync(path.join(this.path, 'hardware-qemu.ini.lock/pid'));
							fs.rmdirSync(path.join(this.path, 'hardware-qemu.ini.lock'));
						} catch(err) {}
						resolve();
					}, 1000);
				});
				return 1;
			}
			return 0;
		};
		/**
		 * 启动，然后就不管了
		 * @return {pass: bool, message: 'Error message'}
		 */
		this.launch = function(useWritableSystem) {
			let emulator_exec = path.join(SettingsProvider.get('sdk_root'), 'emulator/emulator.exe');
			if(!fs.existsSync(emulator_exec)) {
				return {pass: false, error: 'core_missing' , message: "Emulator core does not exist."};
			}
			if(this.isRunning()) {
				return {pass: false, error: 'already_running', message: "Emulator is already running."};
			}
			let command = `"${emulator_exec}"${useWritableSystem ? ' -writable-system' : ''} ${SettingsProvider.get('emulator_args')} -avd ${this.name} -qemu ${SettingsProvider.get('qemu_args')}`;
			let preexec = SettingsProvider.get('preexec');
			if(preexec != '') {
				command = preexec + '&' + command;
			}
			child_process.exec(command);
			return {pass: true, message: "Emulator launched."};
		};
		/**
		 * 重置系统镜像
		 * @return 是否成功
		 */
		this.resetSystem = function() {
			if(this.isRunning()) return false;
			let system_qcow2 = path.join(this.path, 'system.img.qcow2');
			try {
				if(!fs.existsSync(system_qcow2)) {
					return true;
				}
				fs.unlinkSync(system_qcow2);
				return true;
			} catch(err) {
				return false;
			}
		};
		/**
		 * 恢复出厂设置
		 * @return 是否成功
		 */
		this.factoryReset = function() {
			if(this.isRunning()) return false;
			let userdata_file1 = path.join(this.path, 'userdata-qemu.img');
			let userdata_file2 = path.join(this.path, 'userdata-qemu.img.qcow2');
			try {
				if(!fs.existsSync(userdata_file1)) {
					return true;
				}
				fs.unlinkSync(userdata_file1);
				if(fs.existsSync(userdata_file2)) {
					fs.unlinkSync(userdata_file2);
				}
				return true;
			} catch(err) {
				return false;
			}
		};
	};
	window.VirtualDevices = new (function() {
		/**
		 * 命令行工具位置
		 */
		this.manager_path = null;
		/**
		 * 模拟设备信息
		 */
		this.devices = null;
		/**
		 * 初始化
		 */
		this.init = async function() {
			$(document).on('settings-loaded', () => {
				this.manager_path = path.join(SettingsProvider.get('sdk_root'),
					'cmdline-tools/', SettingsProvider.get('cli_ver'),
					'bin/avdmanager.bat');
			});
		};
		/**
		 * 更新设备列表
		 */
		this.update_list_async = async function() {
			let data = await this.list_devices_async();
			if(!data.pass) {
				return data;
			}
			this.devices = {};
			for(let device of data.result) {
				this.devices[device.name] = device;
			}
			return {pass: true};
		};
		/**
		 * 列出所有模拟设备
		 * @return {pass: bool, message: 'Error message', result: [VirtualDevice]}
		 */
		this.list_devices_async = async function() {
			if(!fs.existsSync(this.manager_path)) {
				return {pass: false, error: 'manager_missing', message: 'Android SDK command-line tools is not set properly.'};
			}
			let command_line = `"${this.manager_path}" list avd`;
			let result = await new Promise((resolve, reject) => {
				child_process.exec(command_line, (err, stdout, stderr) => {
					resolve({
						code: err,
						output: stdout,
						error: stderr
					});
				});
			});
			if(result.code) {
				return {pass: false, error: 'unknown_error', message: 'Error ' + result.code + ' occured.'};
			}
			let output = result.output;
			output = output.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
			if('' == output) {
				return {pass: true, message: 'Empty response.', result: []}
			}
			let stripHeader = (str) => {
				let lines = str.split("\n");
				if(lines[0][lines[0].length - 1] == ':') {
					lines = lines.slice(1);
				}
				return lines.join("\n").trim();
			};
			output = stripHeader(output);
			if('' == output) {
				return {pass: true, result: []};
			}
			let splitDevices = (str) => {
				let ret = [];
				let current = '';
				for(let line of str.split("\n")) {
					if(/^--+$/.test(line.trim())) {
						ret.push(current.trim());
						current = '';
					} else {
						current += line.trim() + "\n";
					}
				}
				if(current.trim() != '') {
					ret.push(current.trim());
				}
				return ret;
			}
			output = splitDevices(output);
			let ret = [];
			for(let item of output) {
				let match1 = item.match(/^Name\: (.*?)$/m);
				let match2 = item.match(/^Path\: (.*?)$/m);
				let match3 = item.match(/^Based on\: Android (.*?) \((.*?)\) Tag\/ABI\: (.*?)\/(.*?)$/m);
				if(!match1 || !match2 || !match3) {
					continue;
				}
				let data = {
					name: match1[1].trim(),
					displayName: match1[1].trim().replace(/_/g, ' '),
					path: match2[1],
					androidVer: match3[1],
					androidCodeName: match3[2],
					systemType: match3[3],
					abi: match3[4]
				};
				ret.push(new VirtualDevice(data));
			}
			return {pass: true, result: ret};
		}
	})();
	VirtualDevices.init();
})();
