/**
 * 设置前端
 */
(() => {
	window.SettingsUI = new (function() {
		/**
		 * 设置页面值
		 * @return 是否成功
		 */
		this.put = function(key, val) {
			let entry = SettingsProvider.entries[key];
			let inp = $(`[wcl-setting-key=${key}]`);
			if(entry.type == 'bool') {
				if(inp.length) {
					inp[0].checked = val;
					return true;
				}
			} else if(entry.type == 'text') {
				if(inp.length) {
					inp[0].value = val;
					return true;
				}
			}
			return false;
		};
		/**
		 * 获取页面值
		 */
		this.get = function(key) {
			let entry = SettingsProvider.entries[key];
			let inp = $(`[wcl-setting-key=${key}]`);
			if(entry.type == 'bool') {
				if(inp.length) {
					return inp[0].checked;
				}
			} else if(entry.type == 'text') {
				if(inp.length) {
					return inp[0].value;
				}
			}
			return null;
		};
		/**
		 * 获取全部
		 */
		this.get_all = function() {
			let ret = {};
			for(let key in SettingsProvider.entries) {
				ret[key] = this.get(key);
			}
			return ret;
		}
		/**
		 * 页面上显示设置项的值
		 */
		this.actuate = function() {
			for(let key in SettingsProvider.entries) {
				this.put(key, SettingsProvider.get(key));
			}
			this.validate_all();
		};
		/**
		 * 初始化设置页面
		 */
		this.mutate = function() {
			// 修改设置时验证
			for(let key in SettingsProvider.entries) {
				let inp = $(`[wcl-setting-key=${key}]`);
				inp.on('input', $.dethrottle(() => {this.validate_all()}, 300));
			}
			// 丢弃更改
			$('.avds-toolbar-discard').on('click', () => {
				this.actuate();
			});
			// 保存更改
			$('.avds-toolbar-save').on('click', () => {
				SettingsProvider.current = this.get_all();
				SettingsProvider.write();
				AppNav.set_page('list');
			});
		};
		/**
		 * 验证所有设置
		 */
		this.validate_all = function() {
			let data = this.get_all();
			let results = SettingsProvider.validate_all(data);
			for(let key in results.result) {
				let result = results.result[key];
				let inp_whole = $(`[wcl-setting-key=${key}]`).parent();
				let helper_text = inp_whole.children().filter('.mdui-textfield-helper');
				inp_whole[result.pass ? 'removeClass' : 'addClass']('mdui-textfield-invalid');
				helper_text.text(result.message);
			}
		};
	})();
})();
