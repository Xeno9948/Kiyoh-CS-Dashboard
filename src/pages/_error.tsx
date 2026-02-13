import { NextPageContext } from 'next';

function Error({ statusCode }: { statusCode?: number }) {
    return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <h1>{statusCode || 'Error'}</h1>
            <p>
                {statusCode === 404
                    ? 'Page not found'
                    : 'An error occurred'}
            </p>
        </div>
    );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
    return { statusCode };
};

export default Error;
