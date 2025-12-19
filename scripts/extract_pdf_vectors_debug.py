#!/usr/bin/env python3
"""
COMPREHENSIVE PDF Vector Extractor with Deep Debugging
Tests multiple extraction methods and combines results intelligently
"""

import sys
import json
import fitz  # PyMuPDF
from pathlib import Path

# Optional imports
try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

DEBUG = True

def log(msg):
    if DEBUG:
        print(f"[DEBUG] {msg}", file=sys.stderr)

def extract_pdf_vectors(pdf_path: str) -> dict:
    """
    Extract vector data using MULTIPLE methods and combine intelligently
    """
    all_paths = []
    all_texts = []
    path_signatures = set()
    
    def add_path_if_new(path_obj):
        """Add path with intelligent deduplication"""
        # Create more robust signature
        points_str = ','.join([f"{p:.1f}" for p in path_obj['points'][:10]])  # First 5 points
        sig = f"{path_obj['type']}_{points_str}_{path_obj.get('stroke', '')}_{path_obj.get('strokeWidth', 0):.2f}"
        if sig not in path_signatures:
            path_signatures.add(sig)
            all_paths.append(path_obj)
            return True
        return False
    
    try:
        doc = fitz.open(pdf_path)
        page = doc[0]
        
        rect = page.rect
        width = rect.width
        height = rect.height
        
        log(f"Page dimensions: {width} x {height}")
        
        # ========== METHOD 1: get_drawings() ==========
        log("=" * 60)
        log("METHOD 1: get_drawings()")
        log("=" * 60)
        method1_count = 0
        try:
            drawings = page.get_drawings()
            log(f"Found {len(drawings)} drawing groups")
            
            for idx, drawing in enumerate(drawings):
                items = drawing.get("items", [])
                fill_color_raw = drawing.get("fill", None)
                stroke_color_raw = drawing.get("color", None)
                line_width = drawing.get("width", 1)
                
                def color_to_hex(color):
                    if color is None:
                        return None
                    if isinstance(color, str):
                        return color if color.startswith('#') else f"#{color}"
                    if isinstance(color, (list, tuple)):
                        if len(color) >= 3:
                            r, g, b = int(color[0] * 255), int(color[1] * 255), int(color[2] * 255)
                            return f"#{r:02x}{g:02x}{b:02x}"
                    return None
                
                fill_color = color_to_hex(fill_color_raw)
                stroke_color = color_to_hex(stroke_color_raw) or "#000000"
                
                def get_layer_type(stroke, fill, width):
                    if stroke and (stroke == "#000000" or stroke.startswith("#00") or stroke.startswith("#01")):
                        return "walls"
                    if stroke and len(stroke) == 7 and stroke.startswith("#"):
                        try:
                            r = int(stroke[1:3], 16)
                            g = int(stroke[3:5], 16)
                            b = int(stroke[5:7], 16)
                            if abs(r - g) < 10 and abs(g - b) < 10 and r < 200:
                                return "annotations"
                        except:
                            pass
                    if width < 0.5:
                        return "dimensions"
                    return "structure"
                
                layer_type = get_layer_type(stroke_color, fill_color, line_width)
                
                for item in items:
                    item_type = item.get("type", "")
                    rect_coords = item.get("rect", [0, 0, 0, 0])
                    
                    # NOTE: get_drawings() returns coords in PyMuPDF's top-left origin system
                    # rect_coords = [x0, y0, x1, y1] where (x0, y0) is top-left
                    if item_type == "l":  # Line
                        if add_path_if_new({
                            "type": "line",
                            "points": [
                                rect_coords[0],
                                rect_coords[1],  # No flip - already top-left origin
                                rect_coords[2],
                                rect_coords[3],
                            ],
                            "stroke": stroke_color,
                            "strokeWidth": line_width,
                            "layer": layer_type,
                        }):
                            method1_count += 1
                    
                    elif item_type == "re":  # Rectangle
                        if add_path_if_new({
                            "type": "rect",
                            "points": [
                                rect_coords[0],
                                rect_coords[1],  # No flip - already top-left origin
                                rect_coords[2] - rect_coords[0],
                                rect_coords[3] - rect_coords[1],
                            ],
                            "stroke": stroke_color,
                            "fill": fill_color or "transparent",
                            "strokeWidth": line_width,
                            "layer": layer_type,
                        }):
                            method1_count += 1
                    
                    elif item_type == "c":  # Curve
                        points = item.get("points", [])
                        if len(points) >= 6:
                            # Points are already in top-left origin - no flip needed
                            path_points = list(points)  # Use as-is
                            if len(path_points) >= 4:
                                if add_path_if_new({
                                    "type": "path",
                                    "points": path_points,
                                    "stroke": stroke_color,
                                    "strokeWidth": line_width,
                                    "layer": layer_type,
                                }):
                                    method1_count += 1
                    
                    elif item_type == "qu":  # Quadrilateral
                        if len(rect_coords) >= 4:
                            # No flip - coords are already in top-left origin
                            path_points = [
                                rect_coords[0], rect_coords[1],
                                rect_coords[2], rect_coords[1],
                                rect_coords[2], rect_coords[3],
                                rect_coords[0], rect_coords[3],
                            ]
                            if add_path_if_new({
                                "type": "path",
                                "points": path_points,
                                "stroke": stroke_color,
                                "fill": fill_color or None,
                                "strokeWidth": line_width,
                                "layer": layer_type,
                            }):
                                method1_count += 1
                    
                    # Log unknown item types
                    elif item_type not in ["", "f", "s"]:  # f=fill, s=stroke (graphics state)
                        log(f"  Unknown item type: {item_type} in drawing {idx}")
            
            log(f"Method 1 extracted: {method1_count} paths")
        except Exception as e:
            log(f"Method 1 failed: {e}")
            import traceback
            traceback.print_exc()
        
        # ========== METHOD 2: SVG Parsing ==========
        log("=" * 60)
        log("METHOD 2: SVG Parsing")
        log("=" * 60)
        method2_count = 0
        try:
            svg_string = page.get_svg_image(matrix=fitz.Matrix(1, 1))
            log(f"SVG string length: {len(svg_string)}")
            
            import xml.etree.ElementTree as ET
            root = ET.fromstring(svg_string)
            
            def extract_color(elem, attr_name='stroke', default='#000000'):
                color = elem.get(attr_name)
                if color and color != 'none':
                    if color.startswith('#'):
                        return color
                    style = elem.get('style', '')
                    if style:
                        import re
                        match = re.search(rf'{attr_name}:([^;]+)', style)
                        if match:
                            color_val = match.group(1).strip()
                            if color_val.startswith('#'):
                                return color_val
                            rgb_match = re.search(r'rgb\((\d+),\s*(\d+),\s*(\d+)\)', color_val)
                            if rgb_match:
                                r, g, b = int(rgb_match.group(1)), int(rgb_match.group(2)), int(rgb_match.group(3))
                                return f"#{r:02x}{g:02x}{b:02x}"
                return default
            
            def get_layer_from_color(stroke, fill, width):
                if stroke and (stroke == "#000000" or stroke.startswith("#00") or stroke.startswith("#01")):
                    return "walls"
                if stroke and len(stroke) == 7 and stroke.startswith("#"):
                    try:
                        r = int(stroke[1:3], 16)
                        g = int(stroke[3:5], 16)
                        b = int(stroke[5:7], 16)
                        if abs(r - g) < 10 and abs(g - b) < 10 and r < 200:
                            return "annotations"
                    except:
                        pass
                if width < 0.5:
                    return "dimensions"
                return "structure"
            
            # NOTE: SVG from PyMuPDF uses top-left origin (like canvas) - no flip needed!
            def parse_svg_path(d: str, height: float) -> list:
                import re
                points = []
                commands = re.findall(r'[MLHVCSQTAZ][^MLHVCSQTAZ]*', d, re.IGNORECASE)
                current_x = 0
                current_y = 0
                
                for cmd_str in commands:
                    if not cmd_str:
                        continue
                    cmd = cmd_str[0].upper()
                    coords_str = cmd_str[1:].strip()
                    numbers = re.findall(r'-?\d+\.?\d*', coords_str)
                    coords = [float(n) for n in numbers]
                    
                    if cmd == 'M':
                        if len(coords) >= 2:
                            current_x = coords[0]
                            current_y = coords[1]  # No flip - already top-left origin
                            points.extend([current_x, current_y])
                    elif cmd == 'L':
                        if len(coords) >= 2:
                            current_x = coords[0]
                            current_y = coords[1]  # No flip
                            points.extend([current_x, current_y])
                    elif cmd == 'H':
                        if len(coords) >= 1:
                            current_x = coords[0]
                            points.extend([current_x, current_y])
                    elif cmd == 'V':
                        if len(coords) >= 1:
                            current_y = coords[0]  # No flip
                            points.extend([current_x, current_y])
                    elif cmd == 'C':
                        if len(coords) >= 6:
                            current_x = coords[4]
                            current_y = coords[5]  # No flip
                            points.extend([current_x, current_y])
                    elif cmd == 'Z':
                        if len(points) >= 2:
                            points.extend([points[0], points[1]])
                
                return points
            
            def parse_polygon_points(points_str: str, height: float) -> list:
                import re
                points = []
                numbers = re.findall(r'-?\d+\.?\d*', points_str)
                for i in range(0, len(numbers) - 1, 2):
                    if i + 1 < len(numbers):
                        x = float(numbers[i])
                        y = float(numbers[i + 1])  # No flip - already top-left origin
                        points.extend([x, y])
                return points
            
            svg_elements = 0
            def process_svg_element(elem, parent_transform=""):
                nonlocal method2_count, svg_elements
                tag = elem.tag
                if '}' in tag:
                    tag = tag.split('}')[1]
                
                transform = elem.get('transform', parent_transform)
                
                if tag == 'g' or tag == 'svg':
                    for child in elem:
                        process_svg_element(child, transform)
                    return
                
                svg_elements += 1
                
                if tag == 'path':
                    d = elem.get('d', '')
                    if d:
                        points = parse_svg_path(d, height)
                        if len(points) >= 4:
                            stroke = extract_color(elem, 'stroke', '#000000')
                            fill = extract_color(elem, 'fill', 'transparent')
                            stroke_width = float(elem.get('stroke-width', '1'))
                            layer = get_layer_from_color(stroke, fill, stroke_width)
                            if add_path_if_new({
                                "type": "path",
                                "points": points,
                                "stroke": stroke,
                                "fill": fill if fill != 'transparent' else None,
                                "strokeWidth": stroke_width,
                                "layer": layer,
                            }):
                                method2_count += 1
                
                elif tag == 'line':
                    # SVG uses top-left origin - no flip needed
                    x1 = float(elem.get('x1', 0))
                    y1 = float(elem.get('y1', 0))  # No flip
                    x2 = float(elem.get('x2', 0))
                    y2 = float(elem.get('y2', 0))  # No flip
                    stroke = extract_color(elem, 'stroke', '#000000')
                    stroke_width = float(elem.get('stroke-width', '1'))
                    layer = get_layer_from_color(stroke, None, stroke_width)
                    if add_path_if_new({
                        "type": "line",
                        "points": [x1, y1, x2, y2],
                        "stroke": stroke,
                        "strokeWidth": stroke_width,
                        "layer": layer,
                    }):
                        method2_count += 1
                
                elif tag == 'rect':
                    # SVG uses top-left origin - no flip needed
                    x = float(elem.get('x', 0))
                    y = float(elem.get('y', 0))  # No flip - y is top of rect
                    w = float(elem.get('width', 0))
                    h = float(elem.get('height', 0))
                    stroke = extract_color(elem, 'stroke', '#000000')
                    fill = extract_color(elem, 'fill', 'transparent')
                    stroke_width = float(elem.get('stroke-width', '1'))
                    layer = get_layer_from_color(stroke, fill, stroke_width)
                    if add_path_if_new({
                        "type": "rect",
                        "points": [x, y, w, h],
                        "stroke": stroke,
                        "fill": fill if fill != 'transparent' else None,
                        "strokeWidth": stroke_width,
                        "layer": layer,
                    }):
                        method2_count += 1
                
                elif tag == 'polyline' or tag == 'polygon':
                    points_str = elem.get('points', '')
                    points = parse_polygon_points(points_str, height)
                    if points:
                        stroke = extract_color(elem, 'stroke', '#000000')
                        fill = extract_color(elem, 'fill', 'transparent')
                        stroke_width = float(elem.get('stroke-width', '1'))
                        layer = get_layer_from_color(stroke, fill, stroke_width)
                        if add_path_if_new({
                            "type": "path",
                            "points": points,
                            "stroke": stroke,
                            "fill": fill if fill != 'transparent' else None,
                            "strokeWidth": stroke_width,
                            "layer": layer,
                        }):
                            method2_count += 1
            
            process_svg_element(root)
            log(f"Processed {svg_elements} SVG elements")
            log(f"Method 2 extracted: {method2_count} paths")
        except Exception as e:
            log(f"Method 2 failed: {e}")
            import traceback
            traceback.print_exc()
        
        # ========== METHOD 3: get_displaylist() - Raw PDF commands ==========
        log("=" * 60)
        log("METHOD 3: get_displaylist() - Raw PDF commands")
        log("=" * 60)
        method3_count = 0
        try:
            display_list = page.get_displaylist()
            log(f"Display list created")
            
            # Try to extract from display list
            # This gives us access to the raw PDF rendering commands
            for item in display_list:
                # Display list items have different structure
                # We'll try to extract what we can
                pass
            
            # Alternative: Use display list to render and then extract
            zoom = 4.0
            mat = fitz.Matrix(zoom, zoom)
            pix = display_list.get_pixmap(matrix=mat, alpha=False)
            log(f"Rendered display list to {pix.width}x{pix.height} pixmap")
            
            # Now extract from pixmap (same as method 4)
            method3_count = extract_from_pixmap(pix, zoom, height, add_path_if_new)
            log(f"Method 3 extracted: {method3_count} paths")
        except Exception as e:
            log(f"Method 3 failed: {e}")
            import traceback
            traceback.print_exc()
        
        # ========== METHOD 4: Direct pixmap rendering ==========
        log("=" * 60)
        log("METHOD 4: Direct pixmap rendering + line detection")
        log("=" * 60)
        method4_count = 0
        try:
            zoom = 4.0
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat, alpha=False)
            log(f"Rendered page to {pix.width}x{pix.height} pixmap")
            
            method4_count = extract_from_pixmap(pix, zoom, height, add_path_if_new)
            log(f"Method 4 extracted: {method4_count} paths")
        except Exception as e:
            log(f"Method 4 failed: {e}")
            import traceback
            traceback.print_exc()
        
        # ========== TEXT EXTRACTION ==========
        # NOTE: PyMuPDF uses top-left origin (like canvas/images), NOT PDF's bottom-left origin
        # So bbox coordinates are already in the correct orientation - no flipping needed!
        log("=" * 60)
        log("TEXT EXTRACTION")
        log("=" * 60)
        try:
            import math
            text_dict = page.get_text("dict")
            for block in text_dict.get("blocks", []):
                if "lines" in block:
                    for line in block["lines"]:
                        # Get text direction from line
                        line_dir = line.get("dir", (1, 0))
                        rotation = math.degrees(math.atan2(line_dir[1], line_dir[0]))
                        
                        for span in line.get("spans", []):
                            bbox = span.get("bbox", [0, 0, 0, 0])
                            # Use the EXACT font size from the PDF - no modification
                            # This ensures 1:1 match with original PDF rendering
                            fontSize = span.get("size", 1.0)
                            
                            all_texts.append({
                                "x": bbox[0],
                                "y": bbox[1],  # Top of text box
                                "text": span.get("text", ""),
                                "fontSize": fontSize,
                                "fontName": span.get("font", "Arial"),
                                "rotation": rotation
                            })
            log(f"Extracted {len(all_texts)} text elements")
        except Exception as e:
            log(f"Text extraction failed: {e}")
        
        # ========== FINAL SUMMARY ==========
        log("=" * 60)
        log("EXTRACTION SUMMARY")
        log("=" * 60)
        log(f"Method 1 (get_drawings): {method1_count} paths")
        log(f"Method 2 (SVG parsing): {method2_count} paths")
        log(f"Method 3 (displaylist): {method4_count} paths")
        log(f"Method 4 (pixmap): {method4_count} paths")
        log(f"TOTAL UNIQUE PATHS: {len(all_paths)}")
        log(f"TOTAL TEXTS: {len(all_texts)}")
        
        doc.close()
        
        return {
            "texts": all_texts,
            "paths": all_paths,
            "bounds": {
                "width": width,
                "height": height
            },
            "isVector": len(all_paths) > 0 or len(all_texts) > 10,
        }
    except Exception as e:
        log(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "texts": [],
            "paths": [],
            "bounds": {"width": 0, "height": 0},
            "isVector": False
        }

def extract_from_pixmap(pix, zoom, height, add_path_if_new):
    """Extract lines from rendered pixmap
    
    COORDINATE SYSTEM: Pixmap uses top-left origin (like images/canvas).
    No Y-flip needed - just scale pixmap coords to PDF coords.
    """
    count = 0
    scale_factor = 1.0 / zoom
    threshold = 200
    
    try:
        if HAS_NUMPY:
            # Use numpy for efficient processing
            img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
            
            if pix.n == 3:
                gray = np.dot(img_data[...,:3], [0.2989, 0.5870, 0.1140]).astype(np.uint8)
            elif pix.n == 1:
                gray = img_data[:,:,0]
            else:
                gray = img_data[:,:,0] if len(img_data.shape) > 2 else img_data
            
            # Horizontal line detection
            for y in range(0, gray.shape[0], 2):
                line_start = None
                for x in range(gray.shape[1]):
                    if gray[y, x] < threshold:
                        if line_start is None:
                            line_start = x
                    else:
                        if line_start is not None and x - line_start > 5:
                            x1 = line_start * scale_factor
                            y1 = y * scale_factor  # No flip - pixmap uses top-left origin
                            x2 = x * scale_factor
                            y2 = y * scale_factor
                            if add_path_if_new({
                                "type": "line",
                                "points": [x1, y1, x2, y2],
                                "stroke": "#000000",
                                "strokeWidth": 1 * scale_factor,
                                "layer": "walls",
                            }):
                                count += 1
                            line_start = None
                if line_start is not None:
                    x1 = line_start * scale_factor
                    y1 = y * scale_factor  # No flip
                    x2 = gray.shape[1] * scale_factor
                    y2 = y * scale_factor
                    if add_path_if_new({
                        "type": "line",
                        "points": [x1, y1, x2, y2],
                        "stroke": "#000000",
                        "strokeWidth": 1 * scale_factor,
                        "layer": "walls",
                    }):
                        count += 1
            
            # Vertical line detection
            for x in range(0, gray.shape[1], 2):
                line_start = None
                for y in range(gray.shape[0]):
                    if gray[y, x] < threshold:
                        if line_start is None:
                            line_start = y
                    else:
                        if line_start is not None and y - line_start > 5:
                            x1 = x * scale_factor
                            y1 = line_start * scale_factor  # No flip
                            x2 = x * scale_factor
                            y2 = y * scale_factor
                            if add_path_if_new({
                                "type": "line",
                                "points": [x1, y1, x2, y2],
                                "stroke": "#000000",
                                "strokeWidth": 1 * scale_factor,
                                "layer": "walls",
                            }):
                                count += 1
                            line_start = None
                if line_start is not None:
                    x1 = x * scale_factor
                    y1 = line_start * scale_factor  # No flip
                    x2 = x * scale_factor
                    y2 = gray.shape[0] * scale_factor  # End at bottom of image
                    if add_path_if_new({
                        "type": "line",
                        "points": [x1, y1, x2, y2],
                        "stroke": "#000000",
                        "strokeWidth": 1 * scale_factor,
                        "layer": "walls",
                    }):
                        count += 1
        else:
            # Fallback without numpy
            width = pix.width
            height_pix = pix.height
            samples = pix.samples
            n = pix.n
            
            for y in range(0, height_pix, 2):
                line_start = None
                for x in range(width):
                    idx = (y * width + x) * n
                    if n == 1:
                        val = samples[idx]
                    else:
                        val = int((samples[idx] + samples[idx+1] + samples[idx+2]) / 3)
                    
                    if val < threshold:
                        if line_start is None:
                            line_start = x
                    else:
                        if line_start is not None and x - line_start > 5:
                            x1 = line_start / zoom
                            y1 = y / zoom  # No flip
                            x2 = x / zoom
                            y2 = y / zoom
                            if add_path_if_new({
                                "type": "line",
                                "points": [x1, y1, x2, y2],
                                "stroke": "#000000",
                                "strokeWidth": 1 / zoom,
                                "layer": "walls",
                            }):
                                count += 1
                            line_start = None
            
            for x in range(0, width, 2):
                line_start = None
                for y in range(height_pix):
                    idx = (y * width + x) * n
                    if n == 1:
                        val = samples[idx]
                    else:
                        val = int((samples[idx] + samples[idx+1] + samples[idx+2]) / 3)
                    
                    if val < threshold:
                        if line_start is None:
                            line_start = y
                    else:
                        if line_start is not None and y - line_start > 5:
                            x1 = x / zoom
                            y1 = line_start / zoom  # No flip
                            x2 = x / zoom
                            y2 = y / zoom
                            if add_path_if_new({
                                "type": "line",
                                "points": [x1, y1, x2, y2],
                                "stroke": "#000000",
                                "strokeWidth": 1 / zoom,
                                "layer": "walls",
                            }):
                                count += 1
                            line_start = None
    except Exception as e:
        log(f"Pixmap extraction error: {e}")
        import traceback
        traceback.print_exc()
    
    return count

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No PDF path provided"}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    result = extract_pdf_vectors(pdf_path)
    print(json.dumps(result))

