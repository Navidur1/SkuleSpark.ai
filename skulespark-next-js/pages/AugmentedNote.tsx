import React from 'react';

const AugmentedNote = ({ elements }) => {
  return (
    <div>
      {elements.map((element, index) => {
        let renderedElement;

        switch (element.type) {
          case 'Title':
            renderedElement = <h2 style={{ margin: '10px' }} key={index}>{element.text}</h2>;
            break;

          case 'NarrativeText':
            renderedElement = <p style={{ margin: '10px' }} key={index}>{element.text}</p>;
            break;

          case 'List':
            console.log(element.text)
            renderedElement = <ul key={index} style={{ margin: '10px' }}>{
                element.text.map((item, itemIndex) => (
                    <li key={index + '-' + itemIndex} style={{ margin: '5px' }}>
                        {item.text}
                    </li>
                ))
                }
                </ul>
            break;

          // Add more cases for other types if needed

          default:
            renderedElement = <div style={{ margin: '10px' }} key={index}>{element.text}</div>;
            break;
        }

        return renderedElement;
      })}
    </div>
  );
};

export default AugmentedNote;