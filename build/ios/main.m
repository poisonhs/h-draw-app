#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>

@interface RootViewController : UIViewController
@end

@implementation RootViewController
- (BOOL)prefersStatusBarHidden { return NO; }
@end

@interface AppDelegate : UIResponder <UIApplicationDelegate>
@property (strong, nonatomic) UIWindow *window;
@property (strong, nonatomic) WKWebView *webView;
@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
    self.window.backgroundColor = [UIColor whiteColor];

    RootViewController *root = [[RootViewController alloc] init];
    root.view.backgroundColor = [UIColor whiteColor];

    WKWebViewConfiguration *config = [[WKWebViewConfiguration alloc] init];
    config.allowsInlineMediaPlayback = YES;
    self.webView = [[WKWebView alloc] initWithFrame:root.view.bounds configuration:config];
    self.webView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [root.view addSubview:self.webView];

    // 优先加载本地 www/index.html；没有则加载远程页
    NSString *local = [[NSBundle mainBundle] pathForResource:@"index" ofType:@"html" inDirectory:@"www"];
    if (local) {
        NSURL *url = [NSURL fileURLWithPath:local];
        NSURL *dir = [url URLByDeletingLastPathComponent];
        [self.webView loadFileURL:url allowingReadAccessToURL:dir];
    } else {
        NSURL *url = [NSURL URLWithString:@"https://app.hdraw.de"];
        [self.webView loadRequest:[NSURLRequest requestWithURL:url]];
    }

    self.window.rootViewController = root;
    [self.window makeKeyAndVisible];
    return YES;
}

@end

int main(int argc, char * argv[]) {
    @autoreleasepool {
        return UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class]));
    }
}
