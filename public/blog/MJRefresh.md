# MJRefresh

已经很久没有写技术文章了，之前一段时间确实也是很忙，当然这也是一个借口，自己不思进取的成分也有不少。 不过这段时间确实也得到了很多的锻炼，有些东西也没法直接用语言表达，或许，最大的收获在于我渐渐的沉下心来了，不再惧怕那么多行代码了，更了解写程序这回事了。😂


关于`MJRefresh`之前也想研究的，但是奈何能力不够，代码看不进去。现在做的东西多了，知道要做出一个能通用于整个项目乃至开源给很多用户的控件是需要一点点的去搭建和优化的，所以到了一定程度，控件是会大到一定量级的，看不下去看不懂也是很正常的，因为很多代码确实不知道作者是为什么这么写的。


到现在写程序两年了，我并没有自己或者说参与过的开源项目。顶多也就是在公司里写一些项目中用的到的控件，更多的精力用在写业务逻辑，因为公司是做建筑行业协同软件的，要把建筑行业那一套繁琐的线下东西做成线上应用。控件写多了，用是能用，但是真的写到位了吗，能够经得起大量用户的使用吗？我不知道。

带着这样一份疑惑，我回过头来想想自己能否再次去看一些开源项目了，能否好好去体会一个控件该怎么写了，还有没有哪些我没有考虑到的东西。所以，这篇文章我决定写一下 MJRefresh 的解读和理解，它很常用，我现在做过的项目都是用的它，它是一个控件，没有太多高大上的理论，我对它的理解是朴实可靠。但我也不认为我能在短时间内就理解透它，我已经做好了一点点填坑的准备了，打持久战。

唠叨了很多，其实算是讲给自己听的，创建一份仪式感，给自己树立点信心。废话不多说，直接进入正文。


## MJRefreshComponent

`MJRefresh`中的基类，里面抽象了子类共用的方法, 有些方法是供子类调用的，如：

```
- (void)beginRefreshing;
- (void)beginRefreshingWithCompletionBlock:(void (^)(void))completionBlock;
```

有些方法是供子类复写的，如：

```
- (void)prepare;
- (void)placeSubviews;
```

`MJRefresh`继承链上的类较多，层级比较复杂，所以查看执行顺序的时候还是比较吃力的。但是只要搞清楚每一层的类的作用以及`UIView`那些钩子方法的执行先后顺序，可以为理解这个控件提供很大的帮助。

关于执行先后问题，可以参考 [https://www.jianshu.com/p/4a62c10a36f1](https://www.jianshu.com/p/4a62c10a36f1)

这篇文章详细的讲述了 APP 的生命周期方法，以及`UIViewController`和`UIView`的一些钩子方法的执行先后顺序。体现在`MJRefresh`中，是这样的：

```
alloc(prepare) -> setState -> willMoveToSuperView -> layoutSubViews(placeSubviews) -> drawRect
```

其中，`prepare`  `setState ` `placeSubviews ` 是子类会复写的，这些方法子类实现时都会调用`super`来继承父类的实现，所以这里面的关键是要清晰每一个子类该干的事情，更抽象的行为应该出现在更顶层的类的实现中，反之就越应该出现在较低层的子类中。

而`willMoveToSuperView` `drawRect `则并没有明确的说明子类要去复写，主要的代码还是在`MJRefreshComponent`基类中。它们并不是特别关键，但也有需要复写的原因，下文中会谈到他们的作用。

接下来我打算就这几个关键的方法来做一下分析，而不去讲结构层次图了，因为`MJRefresh`的结构层次还是蛮多的，github 上也有 mj 本人画的层次图，我没办法顾及全局的去考虑所有细节，但会尽可能的先去理解这几个关键方法以及下拉刷新的机制，所以下文我也只会围绕 header 的几个类来进行分析。即：

```
MJRefreshComponent -> MJRefreshHeader -> MJRefreshStateHeader -> MJRefreshNormalHeader
```

### prepare

我们按照执行先后顺序来看这些方法，首先就要看`prepare`了。在`prepare`方法中，`MJRrefresh`会做一些初始化操作。

保证在横竖屏切换的时候能够保证自身相对于父视图的左右边距保持不变，这个方法是每个子类都必须的，所以放在了基类`MJRefreshComponent`中。

```
self.autoresizingMask = UIViewAutoresizingFlexibleWidth;
```

设置背景色

```
self.backgroundColor = [UIColor clearColor];
```

设置key，用于`NSUserDefaults`存储最后刷新时间

```
self.lastUpdatedTimeKey = MJRefreshHeaderLastUpdatedTimeKey;
```

设置自身高度，子类的高度可能不同（header 和 footer 就不一样），所以这个操作应该放在子类中去设置。

```
self.mj_h = MJRefreshHeaderHeight;
```

`MJRefreshStateHeader`中开始出现文字设置，用这个类以及其子类可以出现文字了。

```
// 初始化间距
self.labelLeftInset = MJRefreshLabelLeftInset;
    
// 初始化文字
self setTitle:[NSBundle mj_localizedStringForKey:MJRefreshHeaderIdleText] forState:MJRefreshStateIdle];
[self setTitle:[NSBundle mj_localizedStringForKey:MJRefreshHeaderPullingText] forState:MJRefreshStatePulling];
[self setTitle:[NSBundle mj_localizedStringForKey:MJRefreshHeaderRefreshingText] forState:MJRefreshStateRefreshing];
```

`MJRefreshNormalHeader` 是我们用的比较多的一个类，这个类又多了一个控件`UIActivityIndicatorView`以及会旋转的箭头。在这个类中会去初始化`UIActivityIndicatorView `的样式。

```
self.activityIndicatorViewStyle = UIActivityIndicatorViewStyleGray;
```

### setState

先来看基类中的实现。这边值得注意的地方是`setNeedsLayout`方法的处理。MJ 告诉我们这样做的目的是为了先执行完整个继承链上的`setState`，然后再去重新布局。这里之所以要调用`setNeedsLayout`去触发`layoutSubviews`是因为文字的变化会引起左侧箭头位置的变化，这时候需要刷新来重制位置。

```
- (void)setState:(MJRefreshState)state
{
    _state = state;
    
    // 加入主队列的目的是等setState:方法调用完毕、设置完文字后再去布局子控件
    dispatch_async(dispatch_get_main_queue(), ^{
        [self setNeedsLayout];
    });
}
```

然后看看子类中的实现：

这里做到事情 mj 已经标注的很清楚了，不再过多的说明。不考虑 header 中的子视图，那这个空白的 header 需要去完成那些事情，这块代码给出了答案。

```
- (void)setState:(MJRefreshState)state
{
    MJRefreshCheckState
    
    // 根据状态做事情
    if (state == MJRefreshStateIdle) {
        if (oldState != MJRefreshStateRefreshing) return;
        
        // 保存刷新时间
        [[NSUserDefaults standardUserDefaults] setObject:[NSDate date] forKey:self.lastUpdatedTimeKey];
        [[NSUserDefaults standardUserDefaults] synchronize];
        
        // 恢复inset和offset
        [UIView animateWithDuration:MJRefreshSlowAnimationDuration animations:^{
            self.scrollView.mj_insetT += self.insetTDelta;
            
            // 自动调整透明度
            if (self.isAutomaticallyChangeAlpha) self.alpha = 0.0;
        } completion:^(BOOL finished) {
            self.pullingPercent = 0.0;
            
            if (self.endRefreshingCompletionBlock) {
                self.endRefreshingCompletionBlock();
            }
        }];
    } else if (state == MJRefreshStateRefreshing) {
         dispatch_async(dispatch_get_main_queue(), ^{
            [UIView animateWithDuration:MJRefreshFastAnimationDuration animations:^{
                CGFloat top = self.scrollViewOriginalInset.top + self.mj_h;
                // 增加滚动区域top
                self.scrollView.mj_insetT = top;
                // 设置滚动位置
                CGPoint offset = self.scrollView.contentOffset;
                offset.y = -top;
                [self.scrollView setContentOffset:offset animated:NO];
            } completion:^(BOOL finished) {
                [self executeRefreshingCallback];
            }];
         });
    }
}

```
这里的话主要是设置了文字以及去调用属性`lastUpdatedTimeKey`的 setter 方法，这里面不单单是设置了label的文字，还做了一些其他的处理。

```
- (void)setState:(MJRefreshState)state
{
    MJRefreshCheckState
    
    // 设置状态文字
    self.stateLabel.text = self.stateTitles[@(state)];
    
    // 重新设置key（重新显示时间）
    self.lastUpdatedTimeKey = self.lastUpdatedTimeKey;
}
```

这里面主要处理了一下箭头和圈圈。

```
- (void)setState:(MJRefreshState)state
{
    MJRefreshCheckState
    
    // 根据状态做事情
    if (state == MJRefreshStateIdle) {
        if (oldState == MJRefreshStateRefreshing) {
            self.arrowView.transform = CGAffineTransformIdentity;
            
            [UIView animateWithDuration:MJRefreshSlowAnimationDuration animations:^{
                self.loadingView.alpha = 0.0;
            } completion:^(BOOL finished) {
                // 如果执行完动画发现不是idle状态，就直接返回，进入其他状态
                if (self.state != MJRefreshStateIdle) return;
                
                self.loadingView.alpha = 1.0;
                [self.loadingView stopAnimating];
                self.arrowView.hidden = NO;
            }];
        } else {
            [self.loadingView stopAnimating];
            self.arrowView.hidden = NO;
            [UIView animateWithDuration:MJRefreshFastAnimationDuration animations:^{
                self.arrowView.transform = CGAffineTransformIdentity;
            }];
        }
    } else if (state == MJRefreshStatePulling) {
        [self.loadingView stopAnimating];
        self.arrowView.hidden = NO;
        [UIView animateWithDuration:MJRefreshFastAnimationDuration animations:^{
            self.arrowView.transform = CGAffineTransformMakeRotation(0.000001 - M_PI);
        }];
    } else if (state == MJRefreshStateRefreshing) {
        self.loadingView.alpha = 1.0; // 防止refreshing -> idle的动画完毕动作没有被执行
        [self.loadingView startAnimating];
        self.arrowView.hidden = YES;
    }
}
```

### willMoveToSuperview

现在来看看这个方法里做了什么事情？它会去判断父视图的类型，会去设置`mj_x` 和 `mj_w` 两个属性，还会记录`scrollView`的一些基本的属性值。

这个方法在`UIView`的整个生命周期中是会调用两次的，一次是子视图即将添加到父视图上的时候，还有一次是子视图即将从父视图移除的时候。可能有的小伙伴会对这个地方产生疑惑，为什么要把这些初始化操作放在这个里面？不能直接放在初始化方法中吗？其实只要想一下`MJRerfesh`的服务对象就知道了😌，这里是判断父视图是不是`scrollView`以及其子类的最佳位置,放在初始化方法中没法判断父视图，放在`layoutSubViews`中则太晚了，而且会调用多次。

```
- (void)willMoveToSuperview:(UIView *)newSuperview
{
    [super willMoveToSuperview:newSuperview];
    
    // 如果不是UIScrollView，不做任何事情
    if (newSuperview && ![newSuperview isKindOfClass:[UIScrollView class]]) return;
    
    // 旧的父控件移除监听
    [self removeObservers];
    
    if (newSuperview) { // 新的父控件
        // 设置宽度
        self.mj_w = newSuperview.mj_w;
        // 设置位置
        self.mj_x = -_scrollView.mj_insetL;
        
        // 记录UIScrollView
        _scrollView = (UIScrollView *)newSuperview;
        // 设置永远支持垂直弹簧效果
        _scrollView.alwaysBounceVertical = YES;
        // 记录UIScrollView最开始的contentInset
        _scrollViewOriginalInset = _scrollView.mj_inset;
        
        // 添加监听
        [self addObservers];
    }
}
```

在这个方法里，还会去设置对`scrollView`一些属性的监听，到这不看具体的代码也能猜得到绝对要监听的那个属性了：`scrollView`的`contentOffset`。这也是`MJRefresh`下拉刷新发挥作用的真正关键算在。所以接下来我们需要看一下，`MJRefresh`是如何针对该值的变化作出响应调整的。

这个方法主要是在`MJRefreshComponent`中实现的，那几个 header 子类都没有实现，但其实 footer 是进行了复写的，这个我们先不做讨论了，但有一点是明确的，不同层级的类做不同的事情，不去做超出自身职责范围的事情。


### placeSubViews

这个方法在基类中并没有做什么，因为基类中没有子视图😂

由于在`prepare`中初始化了`MJRefresh`的高度，所以需要改变自身的垂直位置，在这里，就可以看出属性`ignoredScrollViewContentInsetTop`的作用，他可以决定`MJRefresh`的垂直位置，从而改变滑动`scrollview`达到临界刷新点所需要的距离。

```
self.mj_y = - self.mj_h - self.ignoredScrollViewContentInsetTop;
```

`MJRefreshStateHeader`中开始出现子视图，所以在这个方法中会布局子视图。这里出现了两个子视图：`stateLabel` 和 `lastUpdatedTimeLabel`，分别代表了显示刷新状态和显示上一次刷新时间的`Label`。下面的代码主要是对其进行布局。如果看了这两个子视图的懒加载方法，你会发现它们也设置了`autoresizingMask`,同样是为了应对横竖屏切换。

```
if (self.stateLabel.hidden) return;

BOOL noConstrainsOnStatusLabel = self.stateLabel.constraints.count == 0;

if (self.lastUpdatedTimeLabel.hidden) {
    // 状态
    if (noConstrainsOnStatusLabel) self.stateLabel.frame = self.bounds;
} else {
    CGFloat stateLabelH = self.mj_h * 0.5;
    // 状态
    if (noConstrainsOnStatusLabel) {
       self.stateLabel.mj_x = 0;
       self.stateLabel.mj_y = 0;
       self.stateLabel.mj_w = self.mj_w;
       self.stateLabel.mj_h = stateLabelH;
    }
    
    // 更新时间
    if (self.lastUpdatedTimeLabel.constraints.count == 0) {
        self.lastUpdatedTimeLabel.mj_x = 0;
        self.lastUpdatedTimeLabel.mj_y = stateLabelH;
        self.lastUpdatedTimeLabel.mj_w = self.mj_w;
        self.lastUpdatedTimeLabel.mj_h = self.mj_h - self.lastUpdatedTimeLabel.mj_y;
    }     
} 
```

这里会调整箭头和圈圈的位置

```
- (void)placeSubviews
{
    [super placeSubviews];
    
    // 箭头的中心点
    CGFloat arrowCenterX = self.mj_w * 0.5;
    if (!self.stateLabel.hidden) {
        CGFloat stateWidth = self.stateLabel.mj_textWith;
        CGFloat timeWidth = 0.0;
        if (!self.lastUpdatedTimeLabel.hidden) {
            timeWidth = self.lastUpdatedTimeLabel.mj_textWith;
        }
        CGFloat textWidth = MAX(stateWidth, timeWidth);
        arrowCenterX -= textWidth / 2 + self.labelLeftInset;
    }
    CGFloat arrowCenterY = self.mj_h * 0.5;
    CGPoint arrowCenter = CGPointMake(arrowCenterX, arrowCenterY);
    
    // 箭头
    if (self.arrowView.constraints.count == 0) {
        self.arrowView.mj_size = self.arrowView.image.size;
        self.arrowView.center = arrowCenter;
    }
        
    // 圈圈
    if (self.loadingView.constraints.count == 0) {
        self.loadingView.center = arrowCenter;
    }
    
    self.arrowView.tintColor = self.stateLabel.textColor;
}
```

回过头来，我们可以思考一下为什么`mj_x` `mj_y` `mj_w` `mj_h` 这四个属性的设置地方是不同的?

`mj_x` `mj_w` 的设置出现在了`MJRefreshComponent`的`willMoveToSuperView`方法中，因为这两个值始终是不会去变的。虽然可能会横竖屏切换，但是`autoresizingMask`的设置就解决了这个问题，`MJRefresh`的水平方向的布局始终是定下来了。

而`mj_h ` `mj_y` 这两个值的设置分别在`MJRefreshHeader`的`prepare`和`placeSubviews`方法中，前者是因为`header`和`footer`的高度是不一样的，而后者是因为`mj_h`的值可能会发生改变，MJ 本人标注的注释表示：

"当自己的高度发生改变了，肯定要重新调整Y值，所以放到placeSubviews方法中设置y值"

### scrollViewContentOffsetDidChange

首先我们来想一下，有哪些情况会引起`contentOffset`的变化？无非是这几种

1. 手指进行拉拽的时候
2. 手指下拉到一定程度松开后的回滚状态时
3. 手指松开后的惯性滚动
4. 调用`setContentOffSet`引起的滚动

这个方法首先会去看本身是否是在刷新状态中，如果是的话，那肯定不会去改变它的`state`状态。如果不是，那么就要分情况考虑了，如果手指正在拖拽中，那么就要根据是否超过临界值而决定是否将状态更改为`pulling`状态，一旦松手，`scrollView`回弹滚动，这时候已经标记为`pulling`状态，所以就要直接调用`beginRefresh`方法了。不过放手的时候，也可能没有超过临界值，这时候不会调用`beginRefresh `，而是会去标记它的`pullingPercent`，从而调整它的`alpha`值。这里专门做了一个渐变的效果，非常有心，赞一个。


```
- (void)scrollViewContentOffsetDidChange:(NSDictionary *)change
{
    [super scrollViewContentOffsetDidChange:change];
    
    // 在刷新的refreshing状态
    if (self.state == MJRefreshStateRefreshing) {
        // 暂时保留
        if (self.window == nil) return;
        
        // sectionheader停留解决
        CGFloat insetT = - self.scrollView.mj_offsetY > _scrollViewOriginalInset.top ? - self.scrollView.mj_offsetY : _scrollViewOriginalInset.top;
        insetT = insetT > self.mj_h + _scrollViewOriginalInset.top ? self.mj_h + _scrollViewOriginalInset.top : insetT;
        self.scrollView.mj_insetT = insetT;
        
        self.insetTDelta = _scrollViewOriginalInset.top - insetT;
        return;
    }
    
    // 跳转到下一个控制器时，contentInset可能会变
     _scrollViewOriginalInset = self.scrollView.mj_inset;
    
    // 当前的contentOffset
    CGFloat offsetY = self.scrollView.mj_offsetY;
    // 头部控件刚好出现的offsetY
    CGFloat happenOffsetY = - self.scrollViewOriginalInset.top;
    
    // 如果是向上滚动到看不见头部控件，直接返回
    // >= -> >
    if (offsetY > happenOffsetY) return;
    
    // 普通 和 即将刷新 的临界点
    CGFloat normal2pullingOffsetY = happenOffsetY - self.mj_h;
    CGFloat pullingPercent = (happenOffsetY - offsetY) / self.mj_h;
    
    if (self.scrollView.isDragging) { // 如果正在拖拽
        self.pullingPercent = pullingPercent;
        if (self.state == MJRefreshStateIdle && offsetY < normal2pullingOffsetY) {
            // 转为即将刷新状态
            self.state = MJRefreshStatePulling;
        } else if (self.state == MJRefreshStatePulling && offsetY >= normal2pullingOffsetY) {
            // 转为普通状态
            self.state = MJRefreshStateIdle;
        }
    } else if (self.state == MJRefreshStatePulling) {// 即将刷新 && 手松开
        // 开始刷新
        [self beginRefreshing];
    } else if (pullingPercent < 1) {
        self.pullingPercent = pullingPercent;
    }
}

```

接下来我们来看看`beginRefreshing`方法做了什么？他其实主要就是把`state`标记为`MJRefreshStateRefreshing`。但是它还做了另外一层判断：`window`的有无。MJ 也做了备注，说明了为什么要有这个判断，主要是因为预防用户过早的调用了`beginRefresh`方法，然而这时候自身还并没有显示出来，所以巧妙的先将`state`标记为了`MJRefreshStateWillRefresh`。


```
- (void)beginRefreshing
{
    [UIView animateWithDuration:MJRefreshFastAnimationDuration animations:^{
        self.alpha = 1.0;
    }];
    self.pullingPercent = 1.0;
    // 只要正在刷新，就完全显示
    if (self.window) {
        self.state = MJRefreshStateRefreshing;
    } else {
        // 预防正在刷新中时，调用本方法使得header inset回置失败
        if (self.state != MJRefreshStateRefreshing) {
            self.state = MJRefreshStateWillRefresh;
            // 刷新(预防从另一个控制器回到这个控制器的情况，回来要重新刷新一下)
            [self setNeedsDisplay];
        }
    }
}

```


到底这个标记会有什么样的影响？这时候就要去另外一个方法里看了：`drawRect`，由上文所说的调用顺序可知，`drawRect`是在最后才回去调用的，此时视图已经被添加到父视图了。通过这种方法，延缓了`MJRefresh`的刷新时间，从而保证了父视图的存在。

```
- (void)drawRect:(CGRect)rect
{
    [super drawRect:rect];
    
    if (self.state == MJRefreshStateWillRefresh) {
        // 预防view还没显示出来就调用了beginRefreshing
        self.state = MJRefreshStateRefreshing;
    }
}
```

### 小结

其实写着写着，发现`MJRefresh`中的东西比我想象的还要多，如果要抓细节把所有东西都理清，估计要写个几篇文章。这次的源代码阅读经历带给我的收获主要是如何进行层级设计以及理解`UIView`生命周期或者说是那几个方法的调用顺序。很多时候，我们会把代码一股脑的放在某一个方法里，这样既没法提高可读性，往往还会出现一些很难发现的错误。如果能够把这些代码打散在不同的层级中，不同的钩子方法中，这样在写那些特别复杂的业务逻辑时思路能够更清晰而少犯错。

`MJRefresh`也不乏一些耐人寻味的小知识点，比如说`__unsafe_unretained`的使用。`__unsafe_unretained`所修饰的指针在所指向对象被销毁时，不会置为`nil`。 在`MJRefresh`中，所有的子视图都是用这种形式去修饰的，因为子视图和父视图的生命周期是相同的，所以在子视图销毁的时候，指向该子视图的指针没必要再去置为`nil`了，子视图销毁后父视图也会销毁，内存回收，也就不会出现什么野指针的情况了。

这次的源代码探索只是开始，以后我还会再回来看`MJRefresh`，我也会去研究其他的开源项目，集思广益。正如牛顿所说，之所以能取得如此成就，就是因为站在了巨人的肩膀上。