// B2 / 子步骤 2：载入现有 glb（只读），把节点层级变换展平成单缓冲，供后续 wgpu 绘制。
use std::error::Error;
use std::path::{Path, PathBuf};

#[derive(Clone, Copy, Default)]
pub struct Vertex {
    pub position: [f32; 3],
    pub normal: [f32; 3],
}

pub struct Model {
    pub vertices: Vec<Vertex>,
    pub indices: Vec<u32>,
    pub min: [f32; 3],
    pub max: [f32; 3],
    pub mesh_count: usize,
    pub primitive_count: usize,
    pub nodes_seen: usize,
    pub source: PathBuf,
    pub images: usize,
    pub materials: usize,
}

/// 在若干父目录中查找现有资源，避免硬编码绝对路径。
pub fn find_asset(relative: &str) -> Option<PathBuf> {
    if let Ok(explicit) = std::env::var("B2_MODEL") {
        let path = PathBuf::from(explicit);
        if path.is_file() {
            return Some(path);
        }
    }
    let mut dir = std::env::current_exe().ok()?;
    for _ in 0..7 {
        dir = dir.parent()?.to_path_buf();
        let candidate = dir.join(relative);
        if candidate.is_file() {
            return Some(candidate);
        }
    }
    None
}

fn mul(a: [[f32; 4]; 4], b: [[f32; 4]; 4]) -> [[f32; 4]; 4] {
    // column-major (gltf convention)
    let mut out = [[0.0f32; 4]; 4];
    for column in 0..4 {
        for row in 0..4 {
            let mut sum = 0.0;
            for k in 0..4 {
                sum += a[k][row] * b[column][k];
            }
            out[column][row] = sum;
        }
    }
    out
}

fn apply(matrix: [[f32; 4]; 4], point: [f32; 3]) -> [f32; 3] {
    let mut out = [0.0f32; 3];
    for row in 0..3 {
        out[row] = matrix[0][row] * point[0] + matrix[1][row] * point[1] + matrix[2][row] * point[2] + matrix[3][row];
    }
    out
}

/// 只取旋转/缩放的线性部分变换法线（忽略平移），随后归一化。
fn apply_normal(matrix: [[f32; 4]; 4], normal: [f32; 3]) -> Option<[f32; 3]> {
    let mut out = [0.0f32; 3];
    for row in 0..3 {
        out[row] = matrix[0][row] * normal[0] + matrix[1][row] * normal[1] + matrix[2][row] * normal[2];
    }
    let length = (out[0] * out[0] + out[1] * out[1] + out[2] * out[2]).sqrt();
    if length <= 1e-6 {
        return None;
    }
    Some([out[0] / length, out[1] / length, out[2] / length])
}

pub fn load(path: &Path) -> Result<Model, Box<dyn Error>> {
    let (document, buffers, images) = gltf::import(path)?;
    let mut vertices: Vec<Vertex> = Vec::new();
    let mut indices: Vec<u32> = Vec::new();
    let mut min = [f32::MAX; 3];
    let mut max = [f32::MIN; 3];
    let mut primitive_count = 0usize;
    let mut nodes_seen = 0usize;

    let mut stack: Vec<(gltf::Node, [[f32; 4]; 4])> = Vec::new();
    for scene in document.scenes() {
        for node in scene.nodes() {
            stack.push((node, diagonal()));
        }
    }
    while let Some((node, parent)) = stack.pop() {
        nodes_seen += 1;
        let world = mul(parent, node.transform().matrix());
        if let Some(mesh) = node.mesh() {
            for primitive in mesh.primitives() {
                primitive_count += 1;
                let reader = primitive.reader(|buffer| Some(&buffers[buffer.index()]));
                let positions: Vec<[f32; 3]> = match reader.read_positions() {
                    Some(iter) => iter.collect(),
                    None => continue,
                };
                let normals: Vec<[f32; 3]> = match reader.read_normals() {
                    Some(iter) => iter.collect(),
                    None => Vec::new(),
                };
                let base = vertices.len() as u32;
                for (index, position) in positions.iter().enumerate() {
                    let world_position = apply(world, *position);
                    for axis in 0..3 {
                        if world_position[axis] < min[axis] {
                            min[axis] = world_position[axis];
                        }
                        if world_position[axis] > max[axis] {
                            max[axis] = world_position[axis];
                        }
                    }
                    let normal = normals
                        .get(index)
                        .and_then(|normal| apply_normal(world, *normal))
                        .unwrap_or([0.0, 1.0, 0.0]);
                    vertices.push(Vertex { position: world_position, normal });
                }
                match reader.read_indices() {
                    Some(iter) => indices.extend(iter.into_u32().map(|index| index + base)),
                    None => indices.extend((0..positions.len() as u32).map(|index| index + base)),
                }
            }
        }
        for child in node.children() {
            stack.push((child, world));
        }
    }

    if vertices.is_empty() {
        return Err("the glb contained no mesh vertices".into());
    }
    Ok(Model {
        vertices,
        indices,
        min,
        max,
        mesh_count: document.meshes().count(),
        primitive_count,
        nodes_seen,
        source: path.to_path_buf(),
        images: images.len(),
        materials: document.materials().count(),
    })
}

fn diagonal() -> [[f32; 4]; 4] {
    let mut out = [[0.0f32; 4]; 4];
    out[0][0] = 1.0;
    out[1][1] = 1.0;
    out[2][2] = 1.0;
    out[3][3] = 1.0;
    out
}
