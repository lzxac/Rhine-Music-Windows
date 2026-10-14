// B2 / 子步骤 1：wgpu 渲染管线初始化（本步只清屏，不载入 3D）。
// 窗口几何刻意与 M0 采集协议一致：无边框、客户区 3440×1370、DPR 1，
// 以便后续与 covers-real/cover-startup.png 同角度、同尺寸对照。
// B2：渲染管线 + glb 载入 + 最简光照。刻意不改动现有 TS/C# 代码与构建链。
mod model;
mod pipeline;

use std::sync::Arc;

use winit::application::ApplicationHandler;
use winit::dpi::PhysicalSize;
use winit::event::WindowEvent;
use winit::event_loop::{ActiveEventLoop, ControlFlow, EventLoop};
use winit::keyboard::{Key, NamedKey};
use winit::window::{Window, WindowId};

const CLIENT_WIDTH: u32 = 3440;
const CLIENT_HEIGHT: u32 = 1370;
const CLEAR_COLOR: wgpu::Color = wgpu::Color { r: 0.918, g: 0.898, b: 0.882, a: 1.0 };

struct Gpu {
    surface: wgpu::Surface<'static>,
    device: wgpu::Device,
    queue: wgpu::Queue,
    config: wgpu::SurfaceConfiguration,
}

#[derive(Default)]
struct App {
    window: Option<Arc<Window>>,
    gpu: Option<Gpu>,
    model: Option<model::Model>,
    renderer: Option<pipeline::SceneRenderer>,
    frames_presented: u64,
    first_frame_reported: bool,
}

impl App {
    async fn init_gpu(window: Arc<Window>) -> Result<Gpu, Box<dyn std::error::Error>> {
        let size = window.inner_size();
        let instance = wgpu::Instance::new(wgpu::InstanceDescriptor::default());
        let surface = instance.create_surface(window.clone())?;
        let adapter = instance
            .request_adapter(&wgpu::RequestAdapterOptions {
                power_preference: wgpu::PowerPreference::HighPerformance,
                compatible_surface: Some(&surface),
                force_fallback_adapter: false,
            })
            .await
            .ok_or("no suitable adapter")?;
        println!("B2: adapter = {:?}", adapter.get_info());
        let (device, queue) = adapter
            .request_device(
                &wgpu::DeviceDescriptor {
                    label: Some("b2-device"),
                    required_features: wgpu::Features::empty(),
                    required_limits: wgpu::Limits::default(),
                },
                None,
            )
            .await?;
        let caps = surface.get_capabilities(&adapter);
        let format = caps
            .formats
            .iter()
            .copied()
            .find(|format| format.is_srgb())
            .unwrap_or(caps.formats[0]);
        let config = wgpu::SurfaceConfiguration {
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
            format,
            width: size.width.max(1),
            height: size.height.max(1),
            present_mode: caps.present_modes[0],
            alpha_mode: caps.alpha_modes[0],
            view_formats: vec![],
            desired_maximum_frame_latency: 2,
        };
        surface.configure(&device, &config);
        println!(
            "B2: surface {}x{} format={:?} present_mode={:?} srgb={}",
            config.width, config.height, format, config.present_mode, format.is_srgb()
        );
        Ok(Gpu { surface, device, queue, config })
    }

    fn render(&mut self) {
        let Some(gpu) = self.gpu.as_ref() else { return };
        let frame = match gpu.surface.get_current_texture() {
            Ok(frame) => frame,
            Err(error) => {
                eprintln!("B2: surface acquire failed: {error}");
                return;
            }
        };
        let view = frame.texture.create_view(&wgpu::TextureViewDescriptor::default());
        let mut encoder = gpu.device.create_command_encoder(&wgpu::CommandEncoderDescriptor { label: Some("b2-frame") });
        match self.renderer.as_ref() {
            Some(renderer) => renderer.draw(&mut encoder, &view),
            None => {
                let _pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                    label: Some("b2-clear-pass"),
                    color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                        view: &view,
                        resolve_target: None,
                        ops: wgpu::Operations {
                            load: wgpu::LoadOp::Clear(CLEAR_COLOR),
                            store: wgpu::StoreOp::Store,
                        },
                    })],
                    depth_stencil_attachment: None,
                    timestamp_writes: None,
                    occlusion_query_set: None,
                });
            }
        }
        gpu.queue.submit(std::iter::once(encoder.finish()));
        frame.present();
        self.frames_presented += 1;
        if !self.first_frame_reported {
            self.first_frame_reported = true;
            // 冷启动协议的锚点：与 M0 一样以"首帧可视"作为终点标记。
            println!("B2: first frame presented (frames={})", self.frames_presented);
        }
    }
}

impl ApplicationHandler for App {
    fn resumed(&mut self, event_loop: &ActiveEventLoop) {
        if self.window.is_some() {
            return;
        }
        let attributes = Window::default_attributes()
            .with_title("Rhine Music — Rust B2")
            .with_decorations(false)
            .with_inner_size(PhysicalSize::new(CLIENT_WIDTH, CLIENT_HEIGHT))
            .with_position(winit::dpi::PhysicalPosition::new(0, 0));
        match event_loop.create_window(attributes) {
            Ok(window) => {
                let window = Arc::new(window);
                let size = window.inner_size();
                println!("B2: window created ({}x{})", size.width, size.height);
                match model::find_asset("public/assets/archive-assembly.glb") {
                    Some(path) => match model::load(&path) {
                        Ok(loaded) => {
                            println!(
                                "B2: model loaded from {} — meshes={} primitives={} nodes={} vertices={} indices={} triangles={} images={} materials={}",
                                loaded.source.display(),
                                loaded.mesh_count,
                                loaded.primitive_count,
                                loaded.nodes_seen,
                                loaded.vertices.len(),
                                loaded.indices.len(),
                                loaded.indices.len() / 3,
                                loaded.images,
                                loaded.materials
                            );
                            println!(
                                "B2: model bounds min=({:.3},{:.3},{:.3}) max=({:.3},{:.3},{:.3}) size=({:.3},{:.3},{:.3})",
                                loaded.min[0], loaded.min[1], loaded.min[2],
                                loaded.max[0], loaded.max[1], loaded.max[2],
                                loaded.max[0] - loaded.min[0],
                                loaded.max[1] - loaded.min[1],
                                loaded.max[2] - loaded.min[2]
                            );
                            self.model = Some(loaded);
                        }
                        Err(error) => eprintln!("B2: model load failed: {error}"),
                    },
                    None => eprintln!("B2: asset not found (set B2_MODEL to override)"),
                }
                match pollster::block_on(Self::init_gpu(window.clone())) {
                    Ok(gpu) => {
                        if let Some(model) = self.model.as_ref() {
                            let renderer = pipeline::SceneRenderer::new(
                                &gpu.device,
                                &gpu.queue,
                                gpu.config.format,
                                model,
                                gpu.config.width,
                                gpu.config.height,
                            );
                            println!("B2: scene renderer ready (triangles={})", renderer.triangles());
                            self.renderer = Some(renderer);
                        }
                        self.gpu = Some(gpu);
                        self.window = Some(window.clone());
                        window.request_redraw();
                    }
                    Err(error) => {
                        eprintln!("B2: GPU init failed: {error}");
                        event_loop.exit();
                    }
                }
            }
            Err(error) => {
                eprintln!("B2: failed to create window: {error}");
                event_loop.exit();
            }
        }
    }

    fn window_event(&mut self, event_loop: &ActiveEventLoop, _id: WindowId, event: WindowEvent) {
        match event {
            WindowEvent::CloseRequested => {
                println!("B2: close requested, exiting (frames={})", self.frames_presented);
                event_loop.exit();
            }
            WindowEvent::KeyboardInput { event, .. }
                if event.state.is_pressed() && event.logical_key == Key::Named(NamedKey::Escape) =>
            {
                event_loop.exit();
            }
            WindowEvent::Resized(size) => {
                if size.width > 0 && size.height > 0 {
                    if let (Some(gpu), Some(renderer)) = (self.gpu.as_mut(), self.renderer.as_mut()) {
                        gpu.config.width = size.width;
                        gpu.config.height = size.height;
                        gpu.surface.configure(&gpu.device, &gpu.config);
                        renderer.resize(&gpu.device, &gpu.queue, size.width, size.height);
                    }
                }
            }
            WindowEvent::RedrawRequested => {
                self.render();
                if std::env::var("B2_ONE_FRAME").is_ok() {
                    // 性能测量需要"稳定静止态"：单帧渲染后不再重绘。
                    return;
                }
                if let Some(window) = self.window.as_ref() {
                    window.request_redraw();
                }
            }
            _ => {}
        }
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("B2: starting wgpu pipeline check");
    let event_loop = EventLoop::new()?;
    event_loop.set_control_flow(ControlFlow::Wait);
    let mut app = App::default();
    event_loop.run_app(&mut app)?;
    println!("B2: event loop finished");
    Ok(())
}
