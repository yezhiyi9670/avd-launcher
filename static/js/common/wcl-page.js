window.AppNav = {};

/**
 * 状态切换
 */
(() => {
	$.fn.state = function(str, attrName = 'wcl-state') {
		if(str === undefined) {
			return undefined;
		}
		this.hide();
		this.filter('[' + attrName + '=' + str + ']:not([wcl-state-disabled=true])').show();
		return this;
	};
})();

/**
 * 页面选择
 */
(() => {
	window.AppNav.mdui_drawer = new mdui.Drawer('.wcl-drawer');
	$('.wcl-drawer-toggle').on('click', function() {
		AppNav.mdui_drawer.toggle();
	});

	window.AppNav.set_page = function(str) {
		$('.wcl-paged').state(str);
		let pageTitle = $('.wcl-page-select')
			.removeClass('mdui-list-item-active')
			.filter('[wcl-page=' + str + ']')
			.addClass('mdui-list-item-active')
			.attr('wcl-page-title');
		$('.mdui-typo-title').text(pageTitle);
		$('.wcl-page-containers').css({opacity: 0}).state(str, 'wcl-page');
		let activePageContainer = $('.wcl-page-containers[wcl-page=' + str + ']');
		activePageContainer.css({opacity: 1}, 350);
		activePageContainer.trigger('wcl-page-enter');
	};

	$(() => {
		let activePage = $('.wcl-page-select[wcl-page-selected]').attr('wcl-page');
		if(activePage !== undefined) {
			AppNav.set_page(activePage);
		}

		$('.wcl-page-select').on('click', function() {
			let page = $(this).attr('wcl-page');
			AppNav.set_page(page);
			if($('html').width() < 1024) {
				AppNav.mdui_drawer.close();
			}
		});
	});
})();
