(() => {
	window.WclComponents = new (function() {
		this.resolve = function(type, ele) {
			/**
			 * 设置项文本框
			 */
			if(type == 'wcl-settings-field-text') {
				ele.after(
					$('<div></div>').addClass('mdui-textfield')
					.append(
						$('<label></label>').addClass('mdui-textfield-label')
						.text(ele.attr('label'))
					)
					.append(
						$('<input />').addClass('mdui-textfield-input')
						.attr('spellcheck', 'false')
						.attr('type', 'text')
						.attr('wcl-setting-key', ele.attr('key'))
					)
					.append(
						$('<div></div>').addClass('mdui-textfield-helper')
						.text('')
					)
				);
				ele.remove();
				return;
			}
			/**
			 * 设置项开关
			 */
			if(type == 'wcl-settings-field-check') {
				ele.after(
					$('<label></label>').addClass('mdui-checkbox')
					.append(
						$('<input />')
						.attr('type', 'checkbox')
						.attr('wcl-setting-key', ele.attr('key'))
					)
					.append(
						$('<i></i>').addClass('mdui-checkbox-icon')
					)
					.append(
						$('<span></span>')
						.text(ele.attr('label'))
					)
				);
				ele.remove();
				return;
			}
			/**
			 * 空白页底
			 */
			if(type == 'wcl-void') {
				ele.after(
					$('<div></div>').addClass('wcl-void')
					.append(
						$('<div></div>').addClass('wcl-void-icon')
						.append(
							$('<i></i>').addClass('mdui-icon').addClass('material-icons')
							.text(ele.attr('icon'))
						)
					)
					.append(
						$('<div></div>').addClass('wcl-void-title')
						.text(ele.attr('title'))
					)
					.append(
						ele.attr('loading') == 'true' ? (
							$('<div></div>').addClass('wcl-void-loading')
							.append(
								$('<div class="mdui-progress"><div class="mdui-progress-indeterminate"></div></div>')
							)
						) : (
							$('<div></div>').addClass('wcl-void-content')
							.html(ele.html())
						)
					)
				);
				ele.remove();
				return;
			}
		};
		this.mutation = function() {
			let resolvable = [
				'wcl-settings-field-text',
				'wcl-settings-field-check',
				'wcl-void'
			];
			let self = this;
			for(let type of resolvable) {
				$(type).each(function() {
					self.resolve(type, $(this));
				});
			}
		};
	})();

	WclComponents.mutation();
})();
