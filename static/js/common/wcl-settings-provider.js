const fs = require('fs');
const path = require('path');

/**
 * 设置数据模块
 */
(() => {
	window.SettingsProvider = new (function() {
		/**
		 * 设置存储文件位置
		 */
		this.path = path.join(window.appDir, 'data/settings.json');
		/**
		 * 设置定义
		 */
		this.entries = require('./settings-data.js');
		/**
		 * 当前设置
		 */
		this.current = null;
		/**
		 * 设置文件是否存在
		 */
		this.exists = function() {
			return fs.existsSync(this.path);
		};
		/**
		 * 默认设置值
		 */
		this.get_defaults = function() {
			let ret = {};
			for(let key in this.entries) {
				ret[key] = this.entries[key].default;
			}
			return ret;
		};
		/**
		 * 重置设置文件
		 * @return 是否成功
		 */
		this.reset = function() {
			try {
				fs.writeFileSync(this.path, JSON.stringify(this.get_defaults()));
				return true;
			} catch(err) {
				return false;
			}
		};
		/**
		 * 获取设置（初始化）
		 * @return 是否成功
		 */
		this.init = function() {
			if(!this.exists()) {
				if(!this.reset()) {
					return false;
				}
			}
			try {
				this.current = JSON.parse(fs.readFileSync(this.path));
				for(let key in this.entries) {
					if(undefined === this.current[key]) {
						this.current[key] = this.entries[key].default;
					}
				}
				$(document).trigger('settings-loaded');
				return true;
			} catch(err) {
				return false;
			}
		};
		/**
		 * 写入设置到文件
		 * @return 是否成功
		 */
		this.write = function() {
			if(!this.current) {
				return false;
			}
			$(document).trigger('settings-loaded');
			try {
				fs.writeFileSync(this.path, JSON.stringify(this.current));
				return true;
			} catch(err) {
				return false;
			}
		};
		/**
		 * 获取设置
		 */
		this.get = function(key) {
			if(!this.current) {
				return null;
			}
			return this.current[key];
		};
		/**
		 * 修改设置（不经验证）
		 * @return SettingsProvider
		 */
		this.put = function(key, val) {
			if(this.current) {
				this.current[key] = val;
			}
			return this;
		};
		/**
		 * 包含验证器
		 */
		this.has_validator = function(key) {
			if(!this.current) {
				return null;
			}
			if(!this.entries[key]) {
				return false;
			}
			return !!this.entries[key].validator;
		};
		/**
		 * 验证全部设置
		 */
		this.validate_all = function(content) {
			let ret = {
				pass_all: true,
				result: {}
			};
			for(let key in this.entries) {
				let entry = this.entries[key];
				if(entry.validator) {
					let validator_args = [];
					for(let vk of entry.validator_arg) {
						validator_args.push(content[vk]);
					}
					let validated = entry.validator(...validator_args);
					ret.result[key] = validated;
					if(!validated.pass) {
						ret.pass_all = false;
					}
				}
			}
			return ret;
		};
	})();
})();
