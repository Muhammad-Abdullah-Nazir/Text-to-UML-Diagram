import spacy
import re

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except:
    print("⚠️  Please run: python -m spacy download en_core_web_sm")
    nlp = None

def find_classes(text):
    """Find all class names with multiple detection methods"""
    classes = set()
    
    # Method 1: Explicit class mentions
    explicit_patterns = [
        r'class\s+(\w+)',
        r'entity\s+(\w+)',
        r'table\s+(\w+)',
    ]
    
    for pattern in explicit_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        classes.update([m.capitalize() for m in matches])
    
    # Method 2: Capitalized words
    capitalized = re.findall(r'\b([A-Z][a-z]+)\b', text)
    classes.update(capitalized)
    
    # Method 3: Using spaCy (if available)
    if nlp:
        doc = nlp(text)
        key_verbs = ['has', 'have', 'inherits', 'extends', 'contains', 'uses']
        
        for token in doc:
            if token.lemma_ in key_verbs:
                for child in token.children:
                    if child.dep_ in ['nsubj', 'nsubjpass']:
                        classes.add(child.text.capitalize())
    
    # Filter out common words
    stop_words = {'Has', 'Have', 'The', 'And', 'With', 'From', 'For', 'That', 'This'}
    classes = {c for c in classes if c not in stop_words and len(c) > 2}
    
    return sorted(list(classes))

def find_attributes(text, classes):
    """Find attributes for each class"""
    attributes = {cls: [] for cls in classes}
    
    for cls in classes:
        cls_lower = cls.lower()
        pattern = rf"{cls_lower}\s+(?:has|have)\s+([^.!?]+)"
        matches = re.findall(pattern, text.lower())
        
        for match in matches:
            parts = re.split(r',|\sand\s', match)
            for part in parts:
                part = part.strip()
                part = re.sub(r'\b(a|an|the)\b', '', part).strip()
                if part and not any(part == c.lower() for c in classes):
                    attr_name = part.split()[0] if part.split() else part
                    if len(attr_name) > 1 and attr_name not in attributes[cls]:
                        attributes[cls].append(attr_name)
    
    return attributes

def find_relationships(text, classes):
    """Find relationships between classes"""
    relationships = []
    text_lower = text.lower()
    
    for class1 in classes:
        for class2 in classes:
            if class1 != class2:
                c1 = class1.lower()
                c2 = class2.lower()
                
                # Inheritance
                if f"{c1} inherits from {c2}" in text_lower or f"{c1} extends {c2}" in text_lower:
                    relationships.append({
                        'source': class1,
                        'target': class2,
                        'type': 'inheritance',
                        'label': 'inherits',
                        'color': '#4CAF50'
                    })
                
                # Composition
                elif f"{c1} consists of {c2}" in text_lower:
                    relationships.append({
                        'source': class1,
                        'target': class2,
                        'type': 'composition',
                        'label': 'consists of',
                        'color': '#F44336'
                    })
                
                # Aggregation
                elif f"{c1} contains {c2}" in text_lower or f"{c1} has {c2}" in text_lower:
                    relationships.append({
                        'source': class1,
                        'target': class2,
                        'type': 'aggregation',
                        'label': 'has',
                        'color': '#FF9800'
                    })
                
                # Association
                elif f"{c1} uses {c2}" in text_lower:
                    relationships.append({
                        'source': class1,
                        'target': class2,
                        'type': 'association',
                        'label': 'uses',
                        'color': '#9E9E9E'
                    })
    
    return relationships

def process_text(text):
    """Main processing function"""
    if not text or len(text.strip()) < 10:
        return {
            'success': False,
            'error': 'Text is too short. Please provide more details.'
        }
    
    try:
        classes = find_classes(text)
        
        if not classes:
            return {
                'success': False,
                'error': 'No classes found. Use capitalized class names like Student, Book, etc.'
            }
        
        attributes = find_attributes(text, classes)
        relationships = find_relationships(text, classes)
        
        return {
            'success': True,
            'classes': classes,
            'attributes': attributes,
            'relationships': relationships
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': f'Processing error: {str(e)}'
        }