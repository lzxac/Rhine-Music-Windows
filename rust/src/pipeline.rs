// B2 / 子步骤 3：把展平后的网格上传 GPU，用 M0 基线同款相机参数渲染，
// 只加一个方向光 + 环境项（不复刻现有光照/后处理）。
// 相机参数取自 src/scene.ts（只读参考）：position(-62.26,35.98,43.28)、aim(-0.5,1.1,0.4)、fov 6.15、near 5、far 300。
use glam::{Mat4, Vec3};

use crate::model::Model;

#[repr(C)]
#[derive(Clone, Copy, bytemuck::Pod, bytemuck::Zeroable)]
struct Uniforms {
    view_proj: [[f32; 4]; 4],
    light_dir: [f32; 4],
    light_color: [f32; 4],
    base_color: [f32; 4],
}

const SHADER: &str = r#"
struct Uniforms {
    view_proj: mat4x4<f32>,
    light_dir: vec4<f32>,
    light_color: vec4<f32>,
    base_color: vec4<f32>,
};
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexIn {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
};

struct VertexOut {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) normal: vec3<f32>,
};

@vertex
fn vs_main(input: VertexIn) -> VertexOut {
    var output: VertexOut;
    output.clip_position = uniforms.view_proj * vec4<f32>(input.position, 1.0);
    output.normal = input.normal;
    return output;
}

@fragment
fn fs_main(input: VertexOut) -> @location(0) vec4<f32> {
    let normal = normalize(input.normal);
    let light = normalize(-uniforms.light_dir.xyz);
    let lambert = max(dot(normal, light), 0.0);
    let ambient = 0.38;
    let color = uniforms.base_color.rgb * (uniforms.light_color.rgb * lambert + vec3<f32>(ambient));
    return vec4<f32>(color, 1.0);
}
"#;

pub const BASELINE_CAMERA_POSITION: [f32; 3] = [-62.26, 35.98, 43.28];
pub const BASELINE_CAMERA_AIM: [f32; 3] = [-0.5, 1.1, 0.4];
pub const BASELINE_FOV_DEGREES: f32 = 6.15;
pub const BASELINE_NEAR: f32 = 5.0;
pub const BASELINE_FAR: f32 = 300.0;
/// src/scene.ts:1544-1548 —— settle 态的可见高度（span），用于把取景尺度对齐到基线。
pub const ARCHIVE_SPAN: f32 = 7.33;

pub struct SceneRenderer {
    pipeline: wgpu::RenderPipeline,
    vertex_buffer: wgpu::Buffer,
    index_buffer: wgpu::Buffer,
    index_count: u32,
    uniform_buffer: wgpu::Buffer,
    bind_group: wgpu::BindGroup,
    depth_view: wgpu::TextureView,
    depth_size: (u32, u32),
    triangles: u32,
}

impl SceneRenderer {
    pub fn new(
        device: &wgpu::Device,
        queue: &wgpu::Queue,
        format: wgpu::TextureFormat,
        model: &Model,
        width: u32,
        height: u32,
    ) -> Self {
        let shader = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("b2-shader"),
            source: wgpu::ShaderSource::Wgsl(SHADER.into()),
        });

        let bind_group_layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("b2-bind-group-layout"),
            entries: &[wgpu::BindGroupLayoutEntry {
                binding: 0,
                visibility: wgpu::ShaderStages::VERTEX_FRAGMENT,
                ty: wgpu::BindingType::Buffer {
                    ty: wgpu::BufferBindingType::Uniform,
                    has_dynamic_offset: false,
                    min_binding_size: None,
                },
                count: None,
            }],
        });

        let uniforms = Uniforms {
            view_proj: view_projection(width, height),
            light_dir: [-0.35, -0.82, -0.45, 0.0],
            light_color: [1.0, 0.98, 0.95, 1.0],
            base_color: [0.62, 0.60, 0.58, 1.0],
        };
        let uniform_buffer = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("b2-uniforms"),
            size: std::mem::size_of::<Uniforms>() as u64,
            usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });
        queue.write_buffer(&uniform_buffer, 0, bytemuck::bytes_of(&uniforms));

        let bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: Some("b2-bind-group"),
            layout: &bind_group_layout,
            entries: &[wgpu::BindGroupEntry {
                binding: 0,
                resource: uniform_buffer.as_entire_binding(),
            }],
        });

        let pipeline_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("b2-pipeline-layout"),
            bind_group_layouts: &[&bind_group_layout],
            push_constant_ranges: &[],
        });

        let pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("b2-pipeline"),
            layout: Some(&pipeline_layout),
            vertex: wgpu::VertexState {
                module: &shader,
                entry_point: "vs_main",
                buffers: &[wgpu::VertexBufferLayout {
                    array_stride: std::mem::size_of::<crate::model::Vertex>() as wgpu::BufferAddress,
                    step_mode: wgpu::VertexStepMode::Vertex,
                    attributes: &[
                        wgpu::VertexAttribute { format: wgpu::VertexFormat::Float32x3, offset: 0, shader_location: 0 },
                        wgpu::VertexAttribute { format: wgpu::VertexFormat::Float32x3, offset: 12, shader_location: 1 },
                    ],
                }],
                compilation_options: wgpu::PipelineCompilationOptions::default(),
            },
            primitive: wgpu::PrimitiveState {
                topology: wgpu::PrimitiveTopology::TriangleList,
                strip_index_format: None,
                front_face: wgpu::FrontFace::Ccw,
                cull_mode: None,
                polygon_mode: wgpu::PolygonMode::Fill,
                unclipped_depth: false,
                conservative: false,
            },
            depth_stencil: Some(wgpu::DepthStencilState {
                format: wgpu::TextureFormat::Depth32Float,
                depth_write_enabled: true,
                depth_compare: wgpu::CompareFunction::Less,
                stencil: wgpu::StencilState::default(),
                bias: wgpu::DepthBiasState::default(),
            }),
            multisample: wgpu::MultisampleState::default(),
            fragment: Some(wgpu::FragmentState {
                module: &shader,
                entry_point: "fs_main",
                targets: &[Some(wgpu::ColorTargetState {
                    format,
                    blend: Some(wgpu::BlendState::REPLACE),
                    write_mask: wgpu::ColorWrites::ALL,
                })],
                compilation_options: wgpu::PipelineCompilationOptions::default(),
            }),
            multiview: None,
        });

        let vertex_data: Vec<f32> = model
            .vertices
            .iter()
            .flat_map(|vertex| [vertex.position[0], vertex.position[1], vertex.position[2], vertex.normal[0], vertex.normal[1], vertex.normal[2]])
            .collect();
        let vertex_buffer = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("b2-vertices"),
            size: (vertex_data.len() * 4) as u64,
            usage: wgpu::BufferUsages::VERTEX | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });
        queue.write_buffer(&vertex_buffer, 0, bytemuck::cast_slice(&vertex_data));

        let index_buffer = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("b2-indices"),
            size: (model.indices.len() * 4) as u64,
            usage: wgpu::BufferUsages::INDEX | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });
        queue.write_buffer(&index_buffer, 0, bytemuck::cast_slice(&model.indices));

        let depth_view = create_depth_view(device, width, height);
        Self {
            pipeline,
            vertex_buffer,
            index_buffer,
            index_count: model.indices.len() as u32,
            uniform_buffer,
            bind_group,
            depth_view,
            depth_size: (width, height),
            triangles: (model.indices.len() / 3) as u32,
        }
    }

    pub fn triangles(&self) -> u32 {
        self.triangles
    }

    pub fn resize(&mut self, device: &wgpu::Device, queue: &wgpu::Queue, width: u32, height: u32) {
        if self.depth_size == (width, height) {
            return;
        }
        self.depth_view = create_depth_view(device, width, height);
        self.depth_size = (width, height);
        let uniforms = Uniforms {
            view_proj: view_projection(width, height),
            light_dir: [-0.35, -0.82, -0.45, 0.0],
            light_color: [1.0, 0.98, 0.95, 1.0],
            base_color: [0.62, 0.60, 0.58, 1.0],
        };
        queue.write_buffer(&self.uniform_buffer, 0, bytemuck::bytes_of(&uniforms));
    }

    pub fn draw(&self, encoder: &mut wgpu::CommandEncoder, color: &wgpu::TextureView) {
        let mut pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
            label: Some("b2-scene-pass"),
            color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                view: color,
                resolve_target: None,
                ops: wgpu::Operations {
                    load: wgpu::LoadOp::Clear(wgpu::Color { r: 0.918, g: 0.898, b: 0.882, a: 1.0 }),
                    store: wgpu::StoreOp::Store,
                },
            })],
            depth_stencil_attachment: Some(wgpu::RenderPassDepthStencilAttachment {
                view: &self.depth_view,
                depth_ops: Some(wgpu::Operations {
                    load: wgpu::LoadOp::Clear(1.0),
                    store: wgpu::StoreOp::Store,
                }),
                stencil_ops: None,
            }),
            timestamp_writes: None,
            occlusion_query_set: None,
        });
        pass.set_pipeline(&self.pipeline);
        pass.set_bind_group(0, &self.bind_group, &[]);
        pass.set_vertex_buffer(0, self.vertex_buffer.slice(..));
        pass.set_index_buffer(self.index_buffer.slice(..), wgpu::IndexFormat::Uint32);
        pass.draw_indexed(0..self.index_count, 0, 0..1);
    }
}

fn view_projection(width: u32, height: u32) -> [[f32; 4]; 4] {
    let aspect = width as f32 / height.max(1) as f32;
    let aim = Vec3::from(BASELINE_CAMERA_AIM);
    // 保持 src/scene.ts 的视线方向，按 app 的 settled span 反算距离，
    // 使可见高度与基线一致（distance = span / (2*tan(fov/2))，见 scene.ts:1743）。
    let direction = (Vec3::from(BASELINE_CAMERA_POSITION) - aim).normalize();
    let fov = BASELINE_FOV_DEGREES.to_radians();
    let distance = ARCHIVE_SPAN / (2.0 * (fov / 2.0).tan());
    let eye = aim + direction * distance;
    // wgpu NDC 深度为 0..1，使用 perspective_rh（非 _gl 变体）。
    let projection = Mat4::perspective_rh(fov, aspect, BASELINE_NEAR, BASELINE_FAR);
    let view = Mat4::look_at_rh(eye, aim, Vec3::Y);
    (projection * view).to_cols_array_2d()
}

fn create_depth_view(device: &wgpu::Device, width: u32, height: u32) -> wgpu::TextureView {
    let texture = device.create_texture(&wgpu::TextureDescriptor {
        label: Some("b2-depth"),
        size: wgpu::Extent3d { width: width.max(1), height: height.max(1), depth_or_array_layers: 1 },
        mip_level_count: 1,
        sample_count: 1,
        dimension: wgpu::TextureDimension::D2,
        format: wgpu::TextureFormat::Depth32Float,
        usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
        view_formats: &[],
    });
    texture.create_view(&wgpu::TextureViewDescriptor::default())
}
