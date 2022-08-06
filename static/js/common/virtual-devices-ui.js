const child_process = require('child_process');

(() => {
	window.VirtualDevicesUI = new (function() {
		/**
		 * 正在加载设备
		 */
		this.loading = false;
		/**
		 * 列表加入设备
		 */
		this.push_device = function(device) {
			let menu_link = null;
			let menu_content = null;
			let create_menu_item = (label) => {
				return $('<li></li>').addClass('mdui-menu-item')
				.append(
					$('<a></a>').addClass('mdui-ripple').text(label)
				);
			};
			$('.avds-avd-list').append(
				$('<li></li>').addClass('mdui-list-item avds-avd-item')
				.attr('avds-device-name', device.name)
				.append(
					$('<i></i>').addClass(
						'mdui-icon material-icons mdui-list-item-avatar ' +
						'mdui-color-grey-800 ' +
						'avds-avd-item-icon avds-avd-item-statable'
					)
					.attr('wcl-state', 'off')
					.text('play_arrow')
					.on('click', $.dethrottle(() => {
						this.device_launch_async(device)
					}, 250))
				)
				.append(
					$('<i></i>').addClass(
						'mdui-icon material-icons mdui-list-item-avatar ' +
						'mdui-color-theme-accent ' +
						'avds-avd-item-icon avds-avd-item-statable'
					)
					.attr('wcl-state', 'on')
					.text(SettingsProvider.get('func_force_stop') ? 'stop' : 'smartphone')
					.on('click', $.dethrottle(() => {
						if(SettingsProvider.get('func_force_stop')) {
							this.device_stop_async(device)
						}
					}, 250))
				)
				.append(
					$('<div></div>').addClass('mdui-list-item-content')
					.append(
						$('<div></div>').addClass('mdui-list-item-title mdui-list-item-one-line')
						.text(device.displayName)
					)
					.append(
						$('<div></div>').addClass('mdui-list-item-text mdui-list-item-one-line')
						.text(device.getDescriptor())
					)
				)
				.append(
					menu_link = $('<a></a>').addClass('mdui-list-item-icon mdui-text-color-grey-500')
					.attr('href', 'javascript:;')
					.attr('ondragstart', 'return false;')
					.append(
						$('<i></i>').addClass('mdui-icon material-icons')
						.text('more_vert')
					)
				)
				.append(
					menu_content = $('<ul></ul>').addClass('mdui-menu avds-avd-menu')
					.append(
						create_menu_item('Start').addClass('avds-avd-menu-statable')
						.attr('wcl-state', 'off')
						.on('click', () => {
							this.device_launch_async(device);
						})
					)
					.append(
						create_menu_item('Force stop').addClass('avds-avd-menu-statable')
						.attr('wcl-state', 'on')
						.disabled(!SettingsProvider.get('func_force_stop'))
						.on('click', () => {
							if(!SettingsProvider.get('func_force_stop')) {
								return;
							}
							this.device_stop_async(device);
						})
					)
					.append(
						create_menu_item('Systemless boot').addClass('avds-avd-menu-statable')
						.attr('wcl-state', 'off')
						.attr('wcl-state-disabled', !SettingsProvider.get('func_writable_system'))
						.on('click', () => {
							this.device_launch_async(device, false);
						})
					)
					.append(
						create_menu_item('Reset system').addClass('avds-avd-menu-statable')
						.attr('wcl-state', 'off')
						.attr('wcl-state-disabled', !SettingsProvider.get('func_reset_system'))
						.on('click', async () => {
							if(!await mdui.promises.confirm('You are about to erase all changes to the system image.<br />This action cannot be undone!', 'Reset system')) {
								return;
							}
							let result = device.resetSystem();
							if(result) {
								mdui.snackbar('System image is reset.', {timeout: 1500});
							} else {
								mdui.snackbar('Failed to reset system image.');
							}
						})
					)
					.append(
						create_menu_item('Wipe data').addClass('avds-avd-menu-statable')
						.attr('wcl-state', 'off')
						.attr('wcl-state-disabled', !SettingsProvider.get('func_wipe_data'))
						.on('click', async () => {
							if(!await mdui.promises.confirm('You are about to erase all userdata on this device.<br />This will not affect changes to the system.<br />This action cannot be undone!', 'Wipe data')) {
								return;
							}
							let result = device.factoryReset();
							if(result) {
								mdui.snackbar('Wiped data.', {timeout: 1500});
							} else {
								mdui.snackbar('Failed to wipe data.');
							}
						})
					)
					.append(
						create_menu_item('Show in explorer')
						.on('click', () => {
							child_process.exec(`start explorer "${device.path}"`);
						})
					)
				)
			);
			$(`.avds-avd-item[avds-device-name=${device.name}] .avds-avd-item-statable`).state(
				device.isRunning() ? 'on' : 'off'
			);
			$(`.avds-avd-item[avds-device-name=${device.name}] .avds-avd-menu-statable`).state(
				device.isRunning() ? 'on' : 'off'
			);
			new mdui.Menu(menu_link, menu_content);
		}
		/**
		 * 设置设备状态
		 */
		this.set_device_state = function(device) {
			$(`.avds-avd-item[avds-device-name=${device.name}] .avds-avd-item-statable`).state(
				device.isRunning() ? 'on' : 'off'
			);
			$(`.avds-avd-item[avds-device-name=${device.name}] .avds-avd-menu-statable`).state(
				device.isRunning() ? 'on' : 'off'
			);
		};
		/**
		 * 加载设备列表
		 */
		this.load_devices_async = async function() {
			if(this.loading) return;
			this.loading = true;
			let contents = $('.avds-vds-contents');
			contents.state('loading');
			let result = await VirtualDevices.update_list_async();
			if(!result.pass) {
				contents.state('error');
				this.loading = false;
				return;
			}
			if(VirtualDevices.devices.length == 0) {
				contents.state('empty');
				this.loading = false;
				return;
			}
			contents.state('content');
			$('.avds-avd-list').children().remove();
			for(let name in VirtualDevices.devices) {
				let device = VirtualDevices.devices[name];
				this.push_device(device);
			}
			this.loading = false;
		};
		/**
		 * 更新设备状态
		 */
		this.refresh_device_state = function() {
			if(this.loading) return;
			if(VirtualDevices.devices) {
				for(let name in VirtualDevices.devices) {
					let device = VirtualDevices.devices[name];
					this.set_device_state(device);
				}
			}
		};

		/**
		 * 启动设备
		 */
		this.device_launch_async = async function(device, useWritableSystem = null) {
			if(null === useWritableSystem) {
				useWritableSystem = SettingsProvider.get('func_writable_system');
			}
			let result = device.launch(useWritableSystem);
			if(!result.pass) {
				if(result.error == 'core_missing') {
					mdui.snackbar('Failed to launch: emulator core is missing.');
				} else if(result.error == 'already_running') {
					mdui.snackbar('This device is already running.');
				}
			} else {
				// mdui.snackbar('Device launched. Please wait.', {timeout: 1500});
				await new Promise((resolve, reject) => {
					setTimeout(() => {
						this.refresh_device_state();
						resolve();
					}, 250);
				});
			}
		};
		/**
		 * 停止设备
		 */
		this.device_stop_async = async function(device) {
			let result = await device.forceStop_async();
			if(result == -1) {
				mdui.snackbar('This device has already stopped.');
			} else if(result == 1) {
				// mdui.snackbar('Stopped device.', {timeout: 1500});
			} else {
				mdui.snackbar('Failed to stop device.');
			}
			await new Promise((resolve, reject) => {
				setTimeout(() => {
					this.refresh_device_state();
					resolve();
				}, 250);
			});
		};
	})();
	$('.avds-toolbar-refresh').on('click', () => {
		VirtualDevicesUI.load_devices_async();
	});
	setInterval(() => {
		VirtualDevicesUI.refresh_device_state();
	}, 1500);
})();
