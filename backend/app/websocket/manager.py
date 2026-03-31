"""
WebSocket Manager for real-time updates

Handles Socket.IO connections and broadcasts for training progress
and prediction updates
"""

import socketio
import logging
import os

logger = logging.getLogger(__name__)

# Configure verbose Socket.IO / Engine.IO logging (overridable via env)
WEBSOCKET_VERBOSE_LOGGING = os.getenv("WEBSOCKET_VERBOSE_LOGGING", "true").lower() == "true"

# Redis URL for cross-process Socket.IO broadcasting (Celery → FastAPI → Browser)
import ssl

# Redis URL for cross-process Socket.IO broadcasting (Celery → FastAPI → Browser)
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')

# python-socketio's AsyncRedisManager may not support rediss:// schema directly.
# Convert rediss:// to redis:// and pass ssl_context via Redis connection options.
# Wrapped in try/except so a Redis unavailability at startup doesn't prevent the
# entire backend from loading — falls back to the in-process manager instead.
try:
    if REDIS_URL.startswith('rediss://'):
        converted_redis_url = REDIS_URL.replace('rediss://', 'redis://', 1)
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        redis_manager = socketio.AsyncRedisManager(converted_redis_url, redis_options={'ssl': ssl_context})
    else:
        redis_manager = socketio.AsyncRedisManager(REDIS_URL)
    logger.info(f"✅ AsyncRedisManager initialized ({REDIS_URL[:30]}...)")
except Exception as e:
    logger.warning(
        f"⚠️  AsyncRedisManager could not connect ({e}); "
        "falling back to in-process pub/sub manager. "
        "Multi-instance WebSocket broadcasting will not work until Redis is reachable."
    )
    redis_manager = None

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    client_manager=redis_manager,
    logger=WEBSOCKET_VERBOSE_LOGGING,
    engineio_logger=WEBSOCKET_VERBOSE_LOGGING
)
   
@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    logger.info(f"Client connected: {sid}")
    await sio.emit('connection_established', {'sid': sid}, room=sid)


@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {sid}")


@sio.event
async def subscribe(sid, data):
    """
    Subscribe to a channel
    
    Channels:
    - training:{session_id} - Training progress updates
    - predictions:{symbol} - Real-time prediction updates
    - market:{symbol} - Market data updates
    """
    channel = data.get('channel')
    if not channel:
        await sio.emit('error', {'message': 'Channel not specified'}, room=sid)
        return
    
    await sio.enter_room(sid, channel)
    logger.info(f"Client {sid} subscribed to {channel}")
    
    await sio.emit('subscribed', {
        'channel': channel,
        'message': f'Successfully subscribed to {channel}'
    }, room=sid)


@sio.event
async def unsubscribe(sid, data):
    """Unsubscribe from a channel"""
    channel = data.get('channel')
    if not channel:
        await sio.emit('error', {'message': 'Channel not specified'}, room=sid)
        return
    
    await sio.leave_room(sid, channel)
    logger.info(f"Client {sid} unsubscribed from {channel}")
    
    await sio.emit('unsubscribed', {
        'channel': channel,
        'message': f'Successfully unsubscribed from {channel}'
    }, room=sid)


# Utility functions for broadcasting

async def broadcast_training_progress(session_id: str, data: dict):
    """
    Broadcast training progress update
    
    Args:
        session_id: Training session ID
        data: Progress data (epoch, loss, progress percentage, etc.)
    """
    channel = f"training:{session_id}"
    await sio.emit('training_progress', data, room=channel)
    logger.debug(f"Broadcasted training progress to {channel}: {data}")


async def broadcast_training_complete(session_id: str, data: dict):
    """
    Broadcast training completion
    
    Args:
        session_id: Training session ID
        data: Completion data (metrics, model info, etc.)
    """
    channel = f"training:{session_id}"
    await sio.emit('training_complete', data, room=channel)
    logger.info(f"Broadcasted training completion to {channel}")


async def broadcast_training_failed(session_id: str, error: str):
    """
    Broadcast training failure
    
    Args:
        session_id: Training session ID
        error: Error message
    """
    channel = f"training:{session_id}"
    await sio.emit('training_failed', {'error': error}, room=channel)
    logger.error(f"Broadcasted training failure to {channel}: {error}")


async def broadcast_prediction(symbol: str, data: dict):
    """
    Broadcast new prediction
    
    Args:
        symbol: Trading symbol
        data: Prediction data
    """
    channel = f"predictions:{symbol}"
    await sio.emit('new_prediction', data, room=channel)
    logger.debug(f"Broadcasted prediction to {channel}")


async def broadcast_market_update(symbol: str, data: dict):
    """
    Broadcast market data update
    
    Args:
        symbol: Trading symbol
        data: Market data
    """
    channel = f"market:{symbol}"
    await sio.emit('market_update', data, room=channel)
    logger.debug(f"Broadcasted market update to {channel}")


async def broadcast_extreme_signal(data: dict):
    """
    Broadcast a new extreme reversal signal to all subscribers.

    Args:
        data: Signal payload dict
    """
    await sio.emit('new_extreme_signal', data, room='extreme-signals')
    logger.info(f"Broadcasted extreme signal for {data.get('symbol', '?')} to extreme-signals channel")


# Export singleton instance
__all__ = [
    'sio',
    'broadcast_training_progress',
    'broadcast_training_complete',
    'broadcast_training_failed',
    'broadcast_prediction',
    'broadcast_market_update',
    'broadcast_extreme_signal',
]
