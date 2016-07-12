/**
 * Created by PuTi(编程即菩提) 5/31/16.
 */
(function () {
    var DIR_LEFT = 'dir_left';
    var DIR_RIGHT = 'dir_right';
    nb.define({
        name: 'nb.widget.Book',
        view: {
            'class': 'nb-book',
            content: [{
                $name: 'pages',
                'class': 'nb-book-pages'
            }, {
                $name: 'bookNext',
                'class': 'nb-book-next',
                content: [{
                    $name: 'pageStatic',
                    'class': 'nb-book-page-static',
                    content: [{
                        'class': 'nb-book-page-left',
                        content: [{
                            $name: 'staticLeftInner',
                            'class': 'nb-book-page-inner'
                        }, {
                            $name: 'staticLeftShadow',
                            'class': 'shadow'
                        }]
                    }, {
                        'class': 'nb-book-page-right',
                        content: [{
                            $name: 'staticRightInner',
                            'class': 'nb-book-page-inner'
                        }, {
                            $name: 'staticRightShadow',
                            'class': 'shadow'
                        }]
                    }]
                }, {
                    $name: 'flip',
                    'class': 'nb-book-page-flip',
                    content: [{
                        $name: 'flipFront',
                        'class': 'nb-book-page-surface front'
                    }, {
                        $name: 'flipBack',
                        'class': 'nb-book-page-surface back'
                    }]
                }, {
                    $name: 'hammer',
                    'class': 'nb-book-page-hammer',
                    content: [{
                        $name: 'hammerPage'
                    }]
                }]
            }]
        },
        method: {
            init: function () {
                var self = this;
                var $el = this.$();
                var $flip = this.$('flip');
                this.$('bookNext').hide();
                this._leftOpacity = 0;
                this._rightOpacity = 0;
                $(document).ready(function () {
                    var mc = Hammer($el[0], {
                        touchAction: 'auto'
                    });
                    mc.get('pan').set({direction: Hammer.DIRECTION_HORIZONTAL,domEvents: true});
                    mc.on('panstart', function (inEvent) {
                        var additionEvent = inEvent.additionalEvent;
                        var centerX = inEvent.center.x;
                        var width = self._width = $el.width();
                        var offsetLeft = self._offsetLeft = $el.offset().left;
                        inEvent.srcEvent.preventDefault();
                        inEvent.srcEvent.stopPropagation();
                        if (self._animating) {
                            return;
                        }
                        self._flipDir = null;
                        if (additionEvent == 'panleft') {
                            if (centerX - offsetLeft < width / 2 || !self.hasNextPage()) {
                                self._deg = 0;
                                self._flipDir = null;
                                return;
                            }
                            self._preFlipPage(true);
                            self._flipDir = DIR_LEFT;
                        } else if (additionEvent == 'panright') {
                            if (centerX - offsetLeft > width / 2 || !self.hasPrevPage()) {
                                self._deg = 0;
                                self._flipDir = null;
                                return;
                            }
                            self._preFlipPage(false);
                            self._flipDir = DIR_RIGHT;
                        }
                        console.log(additionEvent + ':' + centerX);
                    });
                    mc.on('panmove', function (inEvent) {
                        var centerX = inEvent.center.x;
                        var width = self._width;
                        var deg = self._deg = (180 * (centerX - self._offsetLeft - width) / width);
                        var leftOpacity = self._leftOpacity = 0;
                        var rightOpacity = self._leftOpacity = 0;
                        inEvent.srcEvent.preventDefault();
                        inEvent.srcEvent.stopPropagation();
                        if (self._animating || self._flipDir == null) {
                            return;
                        }
                        if (deg > 0) {
                            deg = 0;
                        } else if (deg < -180) {
                            deg = -180;
                        }
                        if (deg >= -90) {
                            rightOpacity = self._rightOpacity = (90 + deg) / 90;
                            leftOpacity = self._leftOpacity = 0;
                        } else if (deg < -90) {
                            rightOpacity = 0;
                            leftOpacity = (90 + deg) / -180;
                        }
                        console.log(deg);
                        $flip.css('transform', 'perspective(2000px) rotateY(' + deg + 'deg)');
                        self.$('staticLeftShadow').css('opacity', leftOpacity);
                        self.$('staticRightShadow').css('opacity', rightOpacity);
                    });
                    mc.on('panend', function (inEvent) {
                        console.log('panend');
                        var deg = self._deg;
                        var dir = self._flipDir;
                        if (self._animating || self._flipDir == null) {
                            return;
                        }
                        if (dir == DIR_LEFT) {
                            if (deg < -90) {
                                self.gotoNextPage();
                            } else {
                                self.cancelFlip();
                            }
                        } else if (dir == DIR_RIGHT) {
                            if (deg < -90) {
                                self.cancelFlip();
                            } else {
                                self.gotoPrevPage();
                            }
                        }inEvent.srcEvent.preventDefault();
                        inEvent.srcEvent.stopPropagation();
                    });
                });
                $el.on("dragstart mousedown", "img", function(inEvent) {
                    inEvent.preventDefault();
                    return false;
                });
            },
            setOpts: function (inOpts) {
                var opts = inOpts;
                var pageList = opts.pageList;
                var $pages = this.$('pages');
                var _pageList = this._pageList = [];
                var index = this._currentPageIndex = opts.index || 0;
                var $staticLeftInner = this.$('staticLeftInner');
                var $staticRightInner = this.$('staticRightInner');
                var $flipFront = this.$('flipFront');
                var $flipBack = this.$('flipBack');
                $pages.empty();
                if (!pageList) {
                    return;
                }
                $.each(pageList, function (inIndex, inPageView) {
                    var page = new inPageView();
                    var $page = page.$().hide();
                    _pageList.push(page);
                    $pages.append($page);
                    $staticLeftInner.append(page.$().clone().hide());
                    $staticRightInner.append(page.$().clone().hide());
                    $flipFront.append(page.$().clone().hide());
                    $flipBack.append(page.$().clone().hide());
                });
                _pageList[0].$().show();
            },
            gotoNextPage: function () {
                this._gotoPage(this._currentPageIndex+1);
            },
            gotoPrevPage: function () {
                this._gotoPage(this._currentPageIndex-1);
            },
            gotoPage: function (pageNo) {
                this._gotoPage(pageNo);
            },
            _gotoPage: function (pageNo) {
                console.log('goto page '+pageNo);
                if (pageNo == this._currentPageIndex) return;
                if (pageNo < 0) return;
                if (pageNo > (this._pageList.length-1)) return;

                var self = this;
                var $flip = this.$('flip');
                var deg = 0;
                var dir = DIR_LEFT;
                var $pageStatic = this.$('pageStatic');
                var $leftShadow = this.$('staticLeftShadow');
                var $rightShadow = this.$('staticRightShadow');
                var inNext = pageNo>this._currentPageIndex;

                if (this._animating) {
                    return;
                }
                if (this._preFlipPage(pageNo)) {
                    if (inNext) {
                        dir = DIR_LEFT;
                        deg = -180;
                        if (this._rightOpacity == 0) {
                            $leftShadow.css('opacity', 0);
                            $rightShadow.css('opacity', 1);
                            setTimeout(function () {
                                $rightShadow.css({
                                    transition: 'opacity linear .25s',
                                    opacity: 0
                                });
                            }, 100);
                            setTimeout(function () {
                                //$leftShadow.css({
                                //    transition: 'opacity linear .25s',
                                //    opacity: 1
                                //});
                            }, .25 * 1000 + 100);
                        }
                    } else {
                        dir = DIR_RIGHT;
                        deg = 0;
                        if (this._rightOpacity == 0) {
                            $leftShadow.css('opacity', 1);
                            $rightShadow.css('opacity', 0);
                            setTimeout(function () {
                                $leftShadow.css({
                                    transition: 'opacity linear .25s',
                                    opacity: 0
                                });
                            }, 100);
                            setTimeout(function () {
                                //$rightShadow.css({
                                //    transition: 'opacity linear .25s',
                                //    opacity: 1
                                //});
                            }, .25 * 1000 + 100);
                        }
                    }
                    this._flipDir = dir;
                    this._animating = true;
                    $flip.addClass('anim');
                    //$pageStatic.css('transform', 'opacity linear .5s');
                    setTimeout(function () {
                        $flip.css({
                            transform: 'perspective(2000px) rotateY(' + deg + 'deg)'
                        });
                    }, 100);

                    setTimeout(function () {
                        self._flipFinished(pageNo);
                    }, 700);
                }
            },
            cancelFlip: function () {
                var self = this;
                var dir = this._flipDir;
                var $flip = this.$('flip');
                var deg = 0;
                if (dir == DIR_LEFT) {
                    deg = 0
                } else if (dir == DIR_RIGHT) {
                    deg = -180;
                }
                this._animating = true;
                $flip.addClass('anim');
                $flip.css({
                    transform: 'perspective(2000px) rotateY(' + deg + 'deg)'
                });
                setTimeout(function () {
                    self._flipCanceled();
                }, 700);
            },
            hasNextPage: function (pageNo) {
                pageNo = pageNo || this._currentPageIndex;
                return pageNo < this._pageList.length-1;
            },
            hasPrevPage: function (pageNo) {
                pageNo = pageNo || this._currentPageIndex;
                return pageNo > 0;
            },
            _flipFinished: function (pageNo) {
                var self = this;
                var pages = this._pageList;
                var pageIndex = this._currentPageIndex;
                var dir = this._flipDir;
                var hideIndex = pageIndex;
                var showIndex;
                if (dir == DIR_LEFT || dir == DIR_RIGHT) {
                    showIndex = this._currentPageIndex = parseInt(pageNo);
                } else {
                    this._animating = false;
                    return;
                }
                pages[hideIndex].$().hide();
                pages[showIndex].$().show();
                setTimeout(function(){
                    self._clipFlip();
                },500);

                console.log('flip finished')
            },
            _flipCanceled: function () {
                var self = this;
                setTimeout(function(){
                    self._clipFlip();
                },500);
                console.log('flip canceled')
            },
            _clipFlip: function () {
                var $flip = this.$('flip');
                var $bookNext = this.$('bookNext');
                var leftOpacity = this._leftOpacity = 0;
                var rightOpacity = this._rightOpacity = 0;
                $bookNext.hide();
                $flip.removeClass('anim');
                $flip.css({
                    transform: 'none'
                });
                this._deg = null;

                this.$('pageStatic').removeClass('anim');

                var $leftShadow = this.$('staticLeftShadow');
                $leftShadow.css({
                    transition: 'none',
                    'opacity': leftOpacity
                });
                var $rightShadow = this.$('staticRightShadow');
                $rightShadow.css({
                    transition: 'none',
                    'opacity': rightOpacity
                });
                this._animating = false;
            },
            _preFlipPage: function (pageNo) {
                var $bookNext = this.$('bookNext');
                var $staticLeftInner = this.$('staticLeftInner');
                var $staticRightInner = this.$('staticRightInner');
                var $flip = this.$('flip');
                var $flipFront = this.$('flipFront');
                var $flipBack = this.$('flipBack');
                var pages = this._pageClone;
                var pageIndex = this._currentPageIndex;
                var leftIndex, rightIndex;
                var deg = 0;
                var isNext = pageNo>this._currentPageIndex;
                if (pageNo === true || pageNo === false) {
                    isNext = pageNo;

                    if (isNext) {
                        pageNo = pageIndex + 1;
                    } else {
                        pageNo = pageIndex - 1;
                    }
                }

                if (isNext) {
                    if (pageNo<this._pageList.length) {
                        leftIndex = pageIndex;
                        rightIndex = pageNo;
                        deg = 0;
                    } else {
                        return false;
                    }
                } else {
                    if (pageNo >=0) {
                        leftIndex = pageNo;
                        rightIndex = pageIndex;
                        deg = -180;
                    } else {
                        return false;
                    }
                }
                if (this._deg == null) {
                    $flip.css({
                        transform: 'perspective(2000px) rotateY(' + deg + 'deg)'
                    });
                }
                if (leftIndex == this._leftIndex && rightIndex == this._rightIndex) {
                    $bookNext.show();
                    return true;
                }

                $bookNext.find('.nb-book-page').hide();

                $staticLeftInner.find('.nb-book-page').eq(leftIndex).show();
                $staticRightInner.find('.nb-book-page').eq(rightIndex).show();
                $flipFront.find('.nb-book-page').eq(leftIndex).show();
                $flipBack.find('.nb-book-page').eq(rightIndex).show();

                this._leftIndex = leftIndex;
                this._rightIndex = rightIndex;
                $bookNext.show();

                return true;
            }
        }
    })
})();