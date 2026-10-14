// B1 里程碑：只做"空窗口能开、能关"，不载入任何 3D 内容、不访问音乐库、
// 不启动本地服务。目的是先验证 Rust 窗口技术栈在本机可用（含链接器）。
use winit::application::ApplicationHandler;
use winit::event::WindowEvent;
use winit::event_loop::{ActiveEventLoop, ControlFlow, EventLoop};
use winit::keyboard::{Key, NamedKey};
use winit::window::{Window, WindowId};

#[derive(Default)]
struct EmptyWindowApp {
    window: Option<Window>,
}

impl ApplicationHandler for EmptyWindowApp {
    fn resumed(&mut self, event_loop: &ActiveEventLoop) {
        if self.window.is_some() {
            return;
        }
        let attributes = Window::default_attributes()
            .with_title("Rhine Music — Rust B1 (empty window)")
            .with_inner_size(winit::dpi::LogicalSize::new(1280.0, 720.0));
        match event_loop.create_window(attributes) {
            Ok(window) => {
                println!("B1: window created ({}x{})", 1280, 720);
                self.window = Some(window);
            }
            Err(error) => {
                eprintln!("B1: failed to create window: {error}");
                event_loop.exit();
            }
        }
    }

    fn window_event(&mut self, event_loop: &ActiveEventLoop, _id: WindowId, event: WindowEvent) {
        match event {
            WindowEvent::CloseRequested => {
                println!("B1: close requested, exiting");
                event_loop.exit();
            }
            WindowEvent::KeyboardInput { event, .. }
                if event.state.is_pressed() && event.logical_key == Key::Named(NamedKey::Escape) =>
            {
                println!("B1: escape pressed, exiting");
                event_loop.exit();
            }
            _ => {}
        }
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("B1: starting empty-window check");
    let event_loop = EventLoop::new()?;
    event_loop.set_control_flow(ControlFlow::Wait);
    let mut app = EmptyWindowApp::default();
    event_loop.run_app(&mut app)?;
    println!("B1: event loop finished");
    Ok(())
}
